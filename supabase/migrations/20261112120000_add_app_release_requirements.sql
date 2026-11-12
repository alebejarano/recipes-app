-- A single public, read-only row controls the oldest supported store build.
-- Keep the minimum-version fields NULL to leave a platform unrestricted.
create table public.app_release_requirements (
  id boolean primary key default true check (id),
  min_ios_version text,
  min_android_version text,
  min_android_build_number integer check (min_android_build_number is null or min_android_build_number > 0),
  ios_store_url text,
  android_store_url text,
  updated_at timestamptz not null default now()
);

insert into public.app_release_requirements (id)
values (true)
on conflict (id) do nothing;

alter table public.app_release_requirements enable row level security;

create policy "Anyone can read the app release requirement"
  on public.app_release_requirements
  for select
  to anon, authenticated
  using (id = true);

revoke all on table public.app_release_requirements from anon, authenticated;
grant select on table public.app_release_requirements to anon, authenticated;
grant select, insert, update, delete on table public.app_release_requirements to service_role;
