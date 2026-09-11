-- Keep every import path at the same 6 MiB limit. The Edge Function remains
-- the canonical validation path, while this bucket-level guard also protects
-- against direct Storage API uploads.

update storage.buckets
set file_size_limit = 6291456,
    allowed_mime_types = array['application/pdf', 'image/jpeg', 'image/png']::text[]
where id = 'recipe-imports';

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
    and coalesce((metadata->>'size'), '0')::bigint <= 6291456
  );
