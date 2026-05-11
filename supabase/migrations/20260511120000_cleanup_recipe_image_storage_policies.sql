-- Keep recipe images publicly readable for shared recipes, but make writes
-- owner-only and guarded by path, MIME type, and size checks.

drop policy if exists "Users can upload recipe images" on storage.objects;
drop policy if exists "Users can update own recipe images" on storage.objects;
drop policy if exists "Users can delete own recipe images" on storage.objects;

drop policy if exists recipe_images_update_own on storage.objects;

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
