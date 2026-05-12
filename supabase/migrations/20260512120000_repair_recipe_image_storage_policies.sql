-- Recreate recipe image write policies explicitly.
-- A production project may have had the legacy upload policy removed before
-- the guarded insert policy existed, which leaves authenticated cover uploads
-- blocked by Storage RLS.

drop policy if exists "Users can upload recipe images" on storage.objects;
drop policy if exists "Users can update own recipe images" on storage.objects;
drop policy if exists "Users can delete own recipe images" on storage.objects;
drop policy if exists recipe_images_insert_guarded on storage.objects;
drop policy if exists recipe_images_update_own on storage.objects;
drop policy if exists recipe_images_delete_own on storage.objects;

create policy recipe_images_insert_guarded
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'recipe-images'
    and owner = auth.uid()
    and (storage.foldername(name))[1] = auth.uid()::text
    and lower(coalesce((metadata->>'mimetype'), '')) in ('image/jpeg', 'image/png')
    and coalesce((metadata->>'size'), '0')::bigint > 0
    and coalesce((metadata->>'size'), '0')::bigint <= 10485760
  );

create policy recipe_images_update_own
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'recipe-images'
    and owner = auth.uid()
  )
  with check (
    bucket_id = 'recipe-images'
    and owner = auth.uid()
    and (storage.foldername(name))[1] = auth.uid()::text
    and lower(coalesce((metadata->>'mimetype'), '')) in ('image/jpeg', 'image/png')
    and coalesce((metadata->>'size'), '0')::bigint > 0
    and coalesce((metadata->>'size'), '0')::bigint <= 10485760
  );

create policy recipe_images_delete_own
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'recipe-images'
    and owner = auth.uid()
  );
