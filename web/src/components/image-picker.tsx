// Pick a photo, in a form: pick, resize, upload, hand the caller a path.
//
// **No `capture` attribute on the input.** `accept="image/*"` alone already
// makes iOS and Android offer "Take Photo" alongside the photo library. Adding
// `capture` would force the camera straight open and hide the library -- wrong
// on a desktop, and wrong when the picture you want is one you already took.
import { ImagePlus, Loader2, X } from 'lucide-react'
import { useRef, useState, type ChangeEvent } from 'react'

import { Button } from '@/components/ui/button'
import { copy } from '@/lib/copy'
import { deleteImage, publicImageUrl, uploadImage } from '@/lib/images'

type Props = {
  /** The stored path, or null for no photo. */
  value: string | null
  onChange: (path: string | null) => void
  label: string
  inputId: string
}

export function ImagePicker({ value, onChange, label, inputId }: Props) {
  const input = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    // Clear straight away so picking the same file twice still fires onChange.
    event.target.value = ''
    if (!file) return

    setPending(true)
    setError(null)
    try {
      const path = await uploadImage(file)
      // The replaced photo is nothing's business now -- drop it rather than
      // letting the bucket collect every picture ever picked. A photo picked
      // and then *cancelled* out of the dialog does leak, which is accepted:
      // uploading on submit instead would make every save path async-with-
      // upload to save a file that costs nothing.
      if (value) await deleteImage(value)
      onChange(path)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : copy.errors.uploadImage)
    } finally {
      setPending(false)
    }
  }

  async function handleRemove() {
    const path = value
    setError(null)
    onChange(null)
    if (!path) return
    try {
      await deleteImage(path)
    } catch {
      // The column is already cleared, which is what the user asked for. A
      // stranded object is not worth putting an error in front of them.
    }
  }

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium">{label}</span>

      <div className="flex flex-col gap-3">
        {value ? (
          <img
            src={publicImageUrl(value)}
            alt=""
            className="aspect-video w-full rounded-md border border-border object-cover"
          />
        ) : (
          <div className="flex aspect-video w-full items-center justify-center rounded-md border border-dashed border-border bg-muted/40">
            <ImagePlus aria-hidden className="size-6 text-muted-foreground" />
          </div>
        )}

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => input.current?.click()}
          >
            {pending ? (
              <Loader2 aria-hidden className="animate-spin" />
            ) : (
              <ImagePlus aria-hidden />
            )}
            {value ? 'Replace' : 'Add photo'}
          </Button>

          {value ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={handleRemove}
            >
              <X aria-hidden />
              Remove
            </Button>
          ) : null}
        </div>
      </div>

      <input
        ref={input}
        id={inputId}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePick}
      />

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
