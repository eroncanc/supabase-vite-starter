// Photo upload and lookup, over the public `images` storage bucket.
//
// Two rules the rest of the app leans on:
//
// 1. **A column holds a path, never a URL.** `projects.image_path` stores
//    `<user_id>/<uuid>.webp`, and
//    `publicImageUrl()` is the only thing that turns one into something an
//    `<img src>` can use. That keeps the stored value independent of the
//    project's hostname, so a restore into a different Supabase project doesn't
//    leave every photo pointing at the old one.
// 2. **The browser resizes before it uploads.** A phone photo is 4-8MB against
//    a 5MiB bucket limit, and Supabase's image transformation API -- which
//    would otherwise do this server-side -- is a Pro-plan feature that is off
//    here. So the resize isn't an optimization, it's what makes the upload fit.
import { supabase } from '@/lib/supabase'
import { copy } from '@/lib/copy'

export const IMAGE_BUCKET = 'images'

/**
 * Longest edge of a stored image, in pixels. Big enough for the largest thing
 * that renders one (a full-width card cover on a 3x display) with room to spare,
 * small enough that a photo lands in tens of KB rather than megabytes.
 */
export const MAX_EDGE = 1024

/** webp at this quality is visually clean and roughly a third of a JPEG. */
const QUALITY = 0.85

/**
 * The size an image should be stored at: scaled so its longest edge is at most
 * `maxEdge`, aspect ratio preserved.
 *
 * **Never scales up.** An image already inside the cap comes back untouched --
 * enlarging a small drawing would cost bytes to add blur, and the point of this
 * function is to make files smaller.
 *
 * Pure, and the only part of this module that is -- which is why it's the part
 * with tests. Canvas and network belong to the browser.
 */
export function resizeDimensions(
  width: number,
  height: number,
  maxEdge: number = MAX_EDGE
): { width: number; height: number } {
  const longest = Math.max(width, height)
  if (longest <= maxEdge) return { width, height }

  const scale = maxEdge / longest
  // Round rather than floor: a 1023.6px edge is 1024, and floor would also let
  // a very thin image round its short edge down to 0.
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

/** Decode a picked file far enough to know its dimensions and draw it. */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.addEventListener('load', () => {
      URL.revokeObjectURL(url)
      resolve(image)
    })
    image.addEventListener('error', () => {
      URL.revokeObjectURL(url)
      reject(new Error(copy.errors.notAnImage))
    })
    image.src = url
  })
}

/** Redraw at the stored size and re-encode as webp. */
async function toWebp(file: File): Promise<Blob> {
  const image = await loadImage(file)
  const { width, height } = resizeDimensions(image.naturalWidth, image.naturalHeight)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) throw new Error(copy.errors.readImage)
  context.drawImage(image, 0, 0, width, height)

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/webp', QUALITY)
  )
  if (!blob) throw new Error(copy.errors.processImage)
  return blob
}

/**
 * Resize, upload, and return the stored **path** -- what goes in the column.
 *
 * The path is `<user_id>/<uuid>.webp`. The uid comes from the session for the
 * same reason inserts source `user_id` there: the bucket's write policies check
 * the first path segment against `auth.uid()`, so a wrong folder is a 403
 * rather than someone else's file. The uuid makes the object unguessable, which
 * is the whole of the privacy story for a public bucket.
 */
export async function uploadImage(file: File): Promise<string> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) throw authError
  if (!user) throw new Error(copy.errors.signedOutUpload)

  const blob = await toWebp(file)
  const path = `${user.id}/${crypto.randomUUID()}.webp`

  const { error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(path, blob, { contentType: 'image/webp' })

  if (error) throw error
  return path
}

/**
 * The URL for a stored path, or undefined for none -- which is exactly what
 * `<AvatarImage src>` and `<img src>` want for "no photo", so callers don't
 * need a conditional around this.
 */
export function publicImageUrl(path: string | null): string | undefined {
  if (!path) return undefined
  return supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl
}

/**
 * Remove a stored object. Called when a photo is replaced or cleared, so the
 * bucket doesn't accumulate every picture ever picked.
 *
 * Deleting the row that references it does *not* come through here: Postgres has
 * no cascade into storage, and chasing that from the app would mean a delete
 * path that can half-succeed. An orphaned photo costs nothing.
 */
export async function deleteImage(path: string): Promise<void> {
  const { error } = await supabase.storage.from(IMAGE_BUCKET).remove([path])
  if (error) throw error
}
