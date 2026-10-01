alter table public.user_entitlements
  add column if not exists legacy_archive_notice_acknowledged_at timestamptz;

create or replace function public.acknowledge_legacy_archive_notice()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  update public.user_entitlements
  set legacy_archive_notice_acknowledged_at = legacy_archive_started_at
  where user_id = v_user_id
    and legacy_archive_enabled
    and legacy_archive_started_at is not null;
end;
$$;

revoke all on function public.acknowledge_legacy_archive_notice() from public, anon;
grant execute on function public.acknowledge_legacy_archive_notice() to authenticated, service_role;
