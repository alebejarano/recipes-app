create or replace function public.update_recipe_document_import_title(
  p_document_id uuid,
  p_title text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_title text := trim(p_title);
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if coalesce(v_title, '') = '' then
    raise exception 'Import name is required';
  end if;

  if char_length(v_title) > 120 then
    raise exception 'Import name must be 120 characters or fewer';
  end if;

  update public.recipe_document_imports
  set title = v_title
  where id = p_document_id
    and user_id = v_user_id
    and deleted_at is null;

  if not found then
    raise exception 'Document not found';
  end if;
end;
$$;

revoke all on function public.update_recipe_document_import_title(uuid, text) from public, anon;
grant execute on function public.update_recipe_document_import_title(uuid, text) to authenticated, service_role;
