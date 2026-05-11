drop policy if exists recipe_imports_insert_guarded on storage.objects;

create policy recipe_imports_insert_guarded
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'recipe-imports'
    and (storage.foldername(name))[1] = auth.uid()::text
    and lower(coalesce((metadata->>'mimetype'), '')) in (
      'application/pdf',
      'image/jpeg',
      'image/png'
    )
    and coalesce((metadata->>'size'), '0')::bigint > 0
    and coalesce((metadata->>'size'), '0')::bigint <= 10485760
  );
