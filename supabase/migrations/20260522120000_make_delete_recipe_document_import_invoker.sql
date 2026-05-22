-- The client intentionally calls this RPC, but it should not need owner-level
-- privileges. Let RLS authorize the soft-delete instead of SECURITY DEFINER.

drop policy if exists recipe_document_imports_soft_delete_own
  on public.recipe_document_imports;

create policy recipe_document_imports_soft_delete_own
  on public.recipe_document_imports
  for update
  to authenticated
  using (
    user_id = (select auth.uid())
    and deleted_at is null
  )
  with check (
    user_id = (select auth.uid())
    and deleted_at is not null
    and status = 'deleted'
    and failed_reason is null
  );

grant update (deleted_at, status, failed_reason, updated_at)
  on table public.recipe_document_imports
  to authenticated;

create or replace function public.delete_recipe_document_import(p_document_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  update public.recipe_document_imports
    set deleted_at = now(),
        status = 'deleted',
        failed_reason = null,
        updated_at = now()
  where id = p_document_id
    and user_id = v_user_id
    and deleted_at is null;

  if not found then
    raise exception 'Document not found';
  end if;
end;
$$;

revoke all on function public.delete_recipe_document_import(uuid) from public, anon;
grant execute on function public.delete_recipe_document_import(uuid) to authenticated, service_role;
