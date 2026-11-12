-- The initial release-requirements table may already be deployed. Add the
-- Android version code separately so existing linked databases upgrade safely.
alter table public.app_release_requirements
  add column if not exists min_android_build_number integer
  check (min_android_build_number is null or min_android_build_number > 0);
