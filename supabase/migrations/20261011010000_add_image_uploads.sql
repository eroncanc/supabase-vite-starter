-- Photos: a bucket to hold them, and a cover image on a project as the example
-- that writes one.
--
-- The bucket is PUBLIC by decision. A private bucket means a signed URL per
-- image, which expires, which means an async fetch inside every render that
-- shows one plus a cache to stop it thrashing. The trade taken instead is
-- unguessable paths: <user_id>/<uuid>.webp, so a link has to be handed out to
-- be followed. If a project's images are actually private, flip `public` to
-- false and add a select policy -- that is a different module, not a setting.
--
-- Consequence of "public": reads through the public URL never consult RLS, so
-- the select policy below is NOT what keeps anyone out of a photo. It exists
-- because Storage reads the row before it deletes it: without a select policy
-- `remove()` deletes nothing and still returns no error, and every replaced
-- photo stays in the bucket. Scoped to your own folder like the writes, so it
-- doesn't also make the bucket listable by everyone signed in.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('images', 'images', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Writes are scoped by the object's first path segment rather than by a join
-- back to the row that references it. An object doesn't know which row it
-- belongs to and doesn't need to: the column referencing it is already RLS'd,
-- so the only question storage has to answer is "is this your folder".
--
-- 5MiB and the mime allow-list are a second line behind the client, which
-- resizes to a webp under 1024px before it uploads. A phone photo is 4-8MB, so
-- an upload that skipped the resize would land right on this limit.

create policy images_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy images_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy images_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy images_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- A storage object PATH, never a URL. publicImageUrl() in lib/images.ts is the
-- only place that turns a path into a URL, which keeps the stored value
-- independent of the project's hostname.
alter table projects add column image_path text;

comment on column projects.image_path is
  'Storage object path in the images bucket. Resolve with publicImageUrl().';

-- Deleting a project does NOT reclaim its object: Postgres has no cascade into
-- storage. Accepted -- an orphaned photo costs nothing.
