drop policy if exists recipe_imports_select_own on storage.objects;
drop policy if exists recipe_imports_update_own on storage.objects;
drop policy if exists recipe_imports_delete_own on storage.objects;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'recipe_imports_select_own'
  ) then
    create policy recipe_imports_select_own
      on storage.objects
      for select
      to authenticated
      using (
        bucket_id = 'recipe-imports'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'recipe_imports_update_own'
  ) then
    create policy recipe_imports_update_own
      on storage.objects
      for update
      to authenticated
      using (
        bucket_id = 'recipe-imports'
        and (storage.foldername(name))[1] = auth.uid()::text
      )
      with check (
        bucket_id = 'recipe-imports'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'recipe_imports_delete_own'
  ) then
    create policy recipe_imports_delete_own
      on storage.objects
      for delete
      to authenticated
      using (
        bucket_id = 'recipe-imports'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;
end
$$;
