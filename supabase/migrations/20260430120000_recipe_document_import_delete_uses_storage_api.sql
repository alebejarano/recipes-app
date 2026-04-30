create or replace function public.delete_recipe_document_import(p_document_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_has_status boolean;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'recipe_document_imports'
      and column_name = 'status'
  ) into v_has_status;

  if v_has_status then
    update public.recipe_document_imports
      set deleted_at = now(),
          status = 'deleted',
          failed_reason = null,
          updated_at = now()
    where id = p_document_id
      and user_id = v_user_id
      and deleted_at is null;
  else
    update public.recipe_document_imports
      set deleted_at = now(),
          updated_at = now()
    where id = p_document_id
      and user_id = v_user_id
      and deleted_at is null;
  end if;

  if not found then
    raise exception 'Document not found';
  end if;
end;
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
