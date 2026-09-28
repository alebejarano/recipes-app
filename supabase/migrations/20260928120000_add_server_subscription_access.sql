-- Keep subscription access decisions in Supabase. Client-side RevenueCat state
-- remains useful for presentation, but it must never be the authority for cloud
-- writes or legacy-library access.

alter table public.user_entitlements
  add column if not exists is_premium boolean,
  add column if not exists has_ever_been_premium boolean,
  add column if not exists legacy_archive_enabled boolean,
  add column if not exists free_active_recipe_limit integer,
  add column if not exists free_active_import_limit_bytes bigint;

-- Every existing entitlement row was created by a Premium activation. Preserve
-- that history so an already-lapsed subscriber qualifies for the archive when
-- the archive UI is introduced.
update public.user_entitlements
set
  is_premium = plan = 'premium',
  has_ever_been_premium = true,
  legacy_archive_enabled = plan <> 'premium',
  free_active_recipe_limit = 100,
  free_active_import_limit_bytes = 52428800
where
  is_premium is null
  or has_ever_been_premium is null
  or legacy_archive_enabled is null
  or free_active_recipe_limit is null
  or free_active_import_limit_bytes is null;

alter table public.user_entitlements
  alter column is_premium set default false,
  alter column is_premium set not null,
  alter column has_ever_been_premium set default false,
  alter column has_ever_been_premium set not null,
  alter column legacy_archive_enabled set default false,
  alter column legacy_archive_enabled set not null,
  alter column free_active_recipe_limit set default 100,
  alter column free_active_recipe_limit set not null,
  alter column free_active_import_limit_bytes set default 52428800,
  alter column free_active_import_limit_bytes set not null;

alter table public.user_entitlements
  drop constraint if exists user_entitlements_free_active_recipe_limit_check,
  add constraint user_entitlements_free_active_recipe_limit_check
    check (free_active_recipe_limit = 100),
  drop constraint if exists user_entitlements_free_active_import_limit_bytes_check,
  add constraint user_entitlements_free_active_import_limit_bytes_check
    check (free_active_import_limit_bytes = 52428800);

-- Give every account a durable server-side access record from the moment it is
-- created, including users who have never subscribed.
insert into public.user_entitlements (
  user_id,
  plan,
  billing_cycle,
  activated_at,
  updated_at
)
select
  users.id,
  'free',
  'month',
  now(),
  now()
from auth.users as users
left join public.user_entitlements as entitlements
  on entitlements.user_id = users.id
where entitlements.user_id is null;

create or replace function public.sync_user_entitlement_access()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.is_premium := new.plan = 'premium';
  if tg_op = 'UPDATE' then
    new.has_ever_been_premium := coalesce(old.has_ever_been_premium, false) or new.is_premium;
  else
    new.has_ever_been_premium := new.is_premium;
  end if;
  new.legacy_archive_enabled := new.has_ever_been_premium and not new.is_premium;
  new.free_active_recipe_limit := 100;
  new.free_active_import_limit_bytes := 52428800;
  return new;
end;
$$;

drop trigger if exists sync_user_entitlement_access on public.user_entitlements;
create trigger sync_user_entitlement_access
  before insert or update of plan, is_premium, has_ever_been_premium,
    legacy_archive_enabled, free_active_recipe_limit, free_active_import_limit_bytes
  on public.user_entitlements
  for each row
  execute function public.sync_user_entitlement_access();

create or replace function public.create_user_entitlement_access()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_entitlements (
    user_id,
    plan,
    billing_cycle,
    activated_at,
    updated_at
  )
  values (new.id, 'free', 'month', now(), now())
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists create_user_entitlement_access on auth.users;
create trigger create_user_entitlement_access
  after insert on auth.users
  for each row
  execute function public.create_user_entitlement_access();

alter table public.user_entitlements enable row level security;

drop policy if exists user_entitlements_select_own on public.user_entitlements;
create policy user_entitlements_select_own
  on public.user_entitlements
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- This is the policy-safe access check used by cloud RLS. It intentionally
-- treats a missing record as Free, so new or unauthenticated users cannot
-- create cloud content before the server has confirmed their entitlement.
create or replace function public.has_active_premium_access(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    p_user_id = (select auth.uid())
    and exists (
      select 1
      from public.user_entitlements
      where user_id = p_user_id
        and is_premium
    );
$$;

revoke all on function public.has_active_premium_access(uuid) from public, anon;
grant execute on function public.has_active_premium_access(uuid) to authenticated, service_role;

-- Recipe cloud writes are Premium-only. Reads remain owner-scoped so a future
-- archive surface can safely expose former-Premium content without restoring
-- write or sync access. The active/archive slot policy is added in the next
-- migration once its tables exist.
drop policy if exists recipes_insert_own on public.recipes;
drop policy if exists recipes_update_own on public.recipes;
drop policy if exists recipes_delete_own on public.recipes;

create policy recipes_insert_own
  on public.recipes
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and public.has_active_premium_access(user_id)
  );

create policy recipes_update_own
  on public.recipes
  for update
  to authenticated
  using (
    (select auth.uid()) = user_id
    and public.has_active_premium_access(user_id)
  )
  with check (
    (select auth.uid()) = user_id
    and public.has_active_premium_access(user_id)
  );

create policy recipes_delete_own
  on public.recipes
  for delete
  to authenticated
  using (
    (select auth.uid()) = user_id
    and public.has_active_premium_access(user_id)
  );
