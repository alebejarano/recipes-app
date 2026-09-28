alter table public.user_entitlements
  add column if not exists legacy_archive_started_at timestamptz;

update public.user_entitlements
set legacy_archive_started_at = coalesce(store_event_at, updated_at, now())
where legacy_archive_enabled and legacy_archive_started_at is null;

create or replace function public.record_legacy_archive_downgrade()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.is_premium and not new.is_premium and new.legacy_archive_enabled then
    update public.user_entitlements
    set legacy_archive_started_at = coalesce(new.store_event_at, now())
    where user_id = new.user_id;
  end if;
  return new;
end;
$$;

drop trigger if exists record_legacy_archive_downgrade on public.user_entitlements;
create trigger record_legacy_archive_downgrade
  after update on public.user_entitlements
  for each row execute function public.record_legacy_archive_downgrade();
