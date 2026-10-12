# Images

Uploaded photos live in the **public `images` bucket**, created by migration
like every other piece of schema (the `[storage.buckets.*]` block in
`config.toml` stays commented so the two can't drift). `projects.image_path` is
the example column that uses it.

- **A column holds a path, never a URL.** `publicImageUrl()` (`lib/images.ts`)
  is the only thing that resolves one, which is what keeps a stored value
  independent of the project's hostname — a restore into a different Supabase
  project doesn't leave every photo pointing at the old one. Never build the URL
  inline, and name new columns `*_path`, not `*_url`.
- **The bucket is public, and the privacy story is the path.** Objects live at
  `<user_id>/<uuid>.webp`, so a link has to be handed out to be followed. A
  private bucket would mean a signed URL per image, which expires, which means
  an async fetch inside every render that shows one plus a cache to stop it
  thrashing. Public reads never consult RLS, so **the select policy on
  `storage.objects` is not protection** — it's there because Storage reads a
  row before deleting it. Without one, `remove()` deletes nothing *and returns
  no error*, so replaced photos pile up silently (web-battle shipped exactly
  that). It's scoped to your own folder so the bucket isn't listable by every
  signed-in user. If an app's images really are private, flip `public` to false
  — that's a different module, with signed URLs.
- **Every policy is scoped by the first path segment**, not by a join back to the
  row that references the object. An object doesn't know which row it belongs
  to and doesn't need to — that column is already RLS'd.
- **The browser resizes before it uploads** (`MAX_EDGE`, webp at 0.85). Not an
  optimization: a phone photo is 4–8 MB against a 5 MiB bucket limit, and
  Supabase's image transformation API, which would do this server-side, is a
  Pro-plan feature. `resizeDimensions()` is split out as the pure, tested part;
  canvas and network are verified by actually uploading.
- **`ImagePicker` uploads on pick and deletes what it replaced.** A photo picked
  and then cancelled out of a dialog leaks an object — accepted, because
  uploading on submit instead would make every save path async-with-upload to
  save a file that costs nothing. Its input carries **no `capture` attribute**:
  `accept="image/*"` alone already offers "Take Photo" beside the library on
  iOS and Android, while `capture` would force the camera and hide the library.
- **Deleting a row does not reclaim its object.** Postgres has no cascade into
  storage, and chasing it from the app means a delete that can half-succeed.
  Orphans are accepted.
