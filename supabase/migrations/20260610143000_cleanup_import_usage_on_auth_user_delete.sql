create or replace function public.cleanup_import_usage_on_auth_user_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.import_upload_events
  where user_id = old.id;

  delete from public.import_upload_user_state
  where user_id = old.id;

  return old;
end;
$$;

revoke all on function public.cleanup_import_usage_on_auth_user_delete()
from public, anon, authenticated, service_role;

drop trigger if exists cleanup_import_usage_on_auth_user_delete
on auth.users;

create trigger cleanup_import_usage_on_auth_user_delete
before delete on auth.users
for each row
execute function public.cleanup_import_usage_on_auth_user_delete();
