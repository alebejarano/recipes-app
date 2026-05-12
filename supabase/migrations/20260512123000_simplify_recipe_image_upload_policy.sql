-- Keep upload authorization checks aligned with Supabase Storage insert behavior.
-- Object ownership is assigned by Storage during upload, so insert policies
-- should validate the bucket and user-owned folder path. MIME and file-size
-- limits are enforced at the bucket level and by the app optimizer.

update storage.buckets
set
  file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg', 'image/png']
where id = 'recipe-images';

drop policy if exists recipe_images_insert_guarded on storage.objects;
drop policy if exists recipe_images_update_own on storage.objects;
drop policy if exists recipe_images_delete_own on storage.objects;

create policy recipe_images_insert_guarded
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'recipe-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy recipe_images_update_own
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'recipe-images'
    and owner_id = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'recipe-images'
    and owner_id = (select auth.uid()::text)
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy recipe_images_delete_own
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'recipe-images'
    and owner_id = (select auth.uid()::text)
  );
