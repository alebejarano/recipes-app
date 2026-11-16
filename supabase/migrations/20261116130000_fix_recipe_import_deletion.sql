-- Uploads made by the service-role Edge Function do not have the customer's
-- Storage owner_id. Authorize reads/deletes against the owned metadata path.
-- Include tombstones so failed physical removal can be retried safely.
drop policy if exists recipe_imports_select_premium on storage.objects;
create policy recipe_imports_select_premium on storage.objects for select to authenticated
  using (
    bucket_id = 'recipe-imports'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and public.has_active_premium_access((select auth.uid()))
    and exists (
      select 1 from public.recipe_document_imports d
      where d.user_id = (select auth.uid())
        and d.storage_bucket = storage.objects.bucket_id
        and d.storage_path = storage.objects.name
    )
  );

drop policy if exists recipe_imports_delete_premium on storage.objects;
create policy recipe_imports_delete_premium on storage.objects for delete to authenticated
  using (
    bucket_id = 'recipe-imports'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and public.has_active_premium_access((select auth.uid()))
    and exists (
      select 1 from public.recipe_document_imports d
      where d.user_id = (select auth.uid())
        and d.storage_bucket = storage.objects.bucket_id
        and d.storage_path = storage.objects.name
    )
  );

create or replace function public.delete_recipe_document_import(p_document_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null or not public.has_active_premium_access(v_user_id) then
    raise exception 'Premium plan required for cloud imports.';
  end if;
  update public.recipe_document_imports
  set deleted_at = coalesce(deleted_at, now()), status = 'deleted',
      failed_reason = null, updated_at = now()
  where id = p_document_id and user_id = v_user_id;
  if not found then raise exception 'Document not found'; end if;
end;
$$;

revoke all on function public.delete_recipe_document_import(uuid) from public, anon;
grant execute on function public.delete_recipe_document_import(uuid) to authenticated, service_role;
