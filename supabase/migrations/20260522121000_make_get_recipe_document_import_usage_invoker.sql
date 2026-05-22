-- The client intentionally calls this usage RPC, but RLS can authorize the
-- read path without owner-level SECURITY DEFINER privileges.

create or replace function public.get_recipe_document_import_usage()
returns table (
  total_count bigint,
  total_bytes bigint
)
language sql
security invoker
set search_path = public
as $$
  select
    count(*) as total_count,
    coalesce(sum(bytes), 0) as total_bytes
  from public.recipe_document_imports
  where user_id = auth.uid()
    and deleted_at is null
    and status in ('uploading', 'uploaded', 'processing', 'ready');
$$;

revoke all on function public.get_recipe_document_import_usage() from public, anon;
grant execute on function public.get_recipe_document_import_usage() to authenticated, service_role;
