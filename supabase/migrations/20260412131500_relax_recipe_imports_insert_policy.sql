drop policy if exists recipe_imports_insert_guarded on storage.objects;

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
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;
end
$$;
