do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'recipe_imports_insert_guarded'
  ) then
    create policy recipe_imports_insert_guarded
      on storage.objects
      for insert
      to authenticated
      with check (
        bucket_id = 'recipe-imports'
        and owner = auth.uid()
        and (storage.foldername(name))[1] = auth.uid()::text
        and lower(coalesce((metadata->>'mimetype'), '')) in ('application/pdf', 'image/jpeg', 'image/png')
        and coalesce((metadata->>'size'), '0')::bigint > 0
        and coalesce((metadata->>'size'), '0')::bigint <= 10485760
      );
  end if;
end
$$;
