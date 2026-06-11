create or replace function public.delete_account_import_usage(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce((select auth.jwt() ->> 'role'), '') <> 'service_role' then
    raise exception 'service_role required'
      using errcode = '42501';
  end if;

  delete from public.import_upload_events
  where user_id = p_user_id;

  delete from public.import_upload_user_state
  where user_id = p_user_id;
end;
$$;

revoke all on function public.delete_account_import_usage(uuid)
from public, anon;

grant execute on function public.delete_account_import_usage(uuid)
to authenticated, service_role;

notify pgrst, 'reload schema';
