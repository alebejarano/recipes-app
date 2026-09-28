-- A former Premium member keeps their cloud library, but Free access is
-- limited to a deliberate active subset. These tables are server authority for
-- that subset; the device must not infer it from a local recipe count.

create table public.free_active_recipe_slots (
  user_id uuid not null references auth.users(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  activated_at timestamptz not null default now(),
  primary key (user_id, recipe_id),
  unique (recipe_id)
);

create index free_active_recipe_slots_user_activated_idx
  on public.free_active_recipe_slots (user_id, activated_at desc);

create table public.free_active_import_slots (
  user_id uuid not null references auth.users(id) on delete cascade,
  recipe_document_import_id uuid not null references public.recipe_document_imports(id) on delete cascade,
  activated_at timestamptz not null default now(),
  primary key (user_id, recipe_document_import_id),
  unique (recipe_document_import_id)
);

create index free_active_import_slots_user_activated_idx
  on public.free_active_import_slots (user_id, activated_at desc);

create or replace function public.assert_free_active_recipe_slot()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit integer;
  v_slot_count integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text, 2));

  select free_active_recipe_limit
    into v_limit
  from public.user_entitlements
  where user_id = new.user_id
    and not is_premium
    and legacy_archive_enabled
  for update;

  if v_limit is null then
    raise exception 'A legacy Free library is required to activate cloud recipes.';
  end if;

  if not exists (
    select 1
    from public.recipes
    where id = new.recipe_id
      and user_id = new.user_id
  ) then
    raise exception 'Recipe does not belong to this user.';
  end if;

  select count(*)
    into v_slot_count
  from public.free_active_recipe_slots
  where user_id = new.user_id;

  if v_slot_count >= v_limit then
    raise exception 'Free plan active recipe limit reached.';
  end if;

  return new;
end;
$$;

create trigger assert_free_active_recipe_slot
  before insert on public.free_active_recipe_slots
  for each row
  execute function public.assert_free_active_recipe_slot();

create or replace function public.assert_free_active_import_slot()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit bigint;
  v_current_bytes bigint;
  v_document_bytes bigint;
begin
  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text, 3));

  select free_active_import_limit_bytes
    into v_limit
  from public.user_entitlements
  where user_id = new.user_id
    and not is_premium
    and legacy_archive_enabled
  for update;

  if v_limit is null then
    raise exception 'A legacy Free library is required to activate cloud imports.';
  end if;

  select bytes
    into v_document_bytes
  from public.recipe_document_imports
  where id = new.recipe_document_import_id
    and user_id = new.user_id
    and deleted_at is null
    and status in ('uploaded', 'processing', 'ready');

  if v_document_bytes is null then
    raise exception 'Import is not available for this user.';
  end if;

  select coalesce(sum(imports.bytes), 0)
    into v_current_bytes
  from public.free_active_import_slots as slots
  join public.recipe_document_imports as imports
    on imports.id = slots.recipe_document_import_id
  where slots.user_id = new.user_id;

  if v_current_bytes + v_document_bytes > v_limit then
    raise exception 'Free plan active import storage limit reached.';
  end if;

  return new;
end;
$$;

create trigger assert_free_active_import_slot
  before insert on public.free_active_import_slots
  for each row
  execute function public.assert_free_active_import_slot();

create or replace function public.seed_free_active_library_slots(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recipe_limit integer;
  v_import_limit bigint;
begin
  if p_user_id is null then
    raise exception 'p_user_id is required';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 2));
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 3));

  select free_active_recipe_limit, free_active_import_limit_bytes
    into v_recipe_limit, v_import_limit
  from public.user_entitlements
  where user_id = p_user_id
    and not is_premium
    and legacy_archive_enabled
  for update;

  if v_recipe_limit is null or v_import_limit is null then
    return;
  end if;

  delete from public.free_active_recipe_slots where user_id = p_user_id;
  insert into public.free_active_recipe_slots (user_id, recipe_id, activated_at)
  select p_user_id, recipes.id, now()
  from public.recipes
  where recipes.user_id = p_user_id
  order by recipes.updated_at desc, recipes.id desc
  limit v_recipe_limit;

  delete from public.free_active_import_slots where user_id = p_user_id;
  insert into public.free_active_import_slots (user_id, recipe_document_import_id, activated_at)
  select p_user_id, ranked.id, now()
  from (
    select
      imports.id,
      sum(imports.bytes) over (order by imports.updated_at desc, imports.id desc) as cumulative_bytes
    from public.recipe_document_imports as imports
    where imports.user_id = p_user_id
      and imports.deleted_at is null
      and imports.status in ('uploaded', 'processing', 'ready')
  ) as ranked
  where ranked.cumulative_bytes <= v_import_limit;
end;
$$;

create or replace function public.maintain_free_active_library_slots()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE'
    and old.is_premium
    and not new.is_premium
    and new.legacy_archive_enabled then
    perform public.seed_free_active_library_slots(new.user_id);
  end if;

  return new;
end;
$$;

drop trigger if exists maintain_free_active_library_slots on public.user_entitlements;
create trigger maintain_free_active_library_slots
  after update on public.user_entitlements
  for each row
  execute function public.maintain_free_active_library_slots();

-- Existing former subscribers predate the downgrade trigger. Seed their
-- active subsets once, using their most recently updated content by default.
select public.seed_free_active_library_slots(user_id)
from public.user_entitlements
where not is_premium
  and legacy_archive_enabled;

create or replace function public.set_free_active_recipe_slots(p_recipe_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_limit integer;
  v_requested_count integer := coalesce(cardinality(p_recipe_ids), 0);
  v_owned_count integer;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 2));

  select free_active_recipe_limit
    into v_limit
  from public.user_entitlements
  where user_id = v_user_id
    and not is_premium
    and legacy_archive_enabled
  for update;

  if v_limit is null then
    raise exception 'Only former Premium users can manage a cloud archive.';
  end if;

  if v_requested_count > v_limit then
    raise exception 'Free plan active recipe limit reached.';
  end if;

  select count(*)
    into v_owned_count
  from public.recipes
  where user_id = v_user_id
    and id = any(coalesce(p_recipe_ids, '{}'::uuid[]));

  if v_owned_count <> v_requested_count then
    raise exception 'Every active recipe must belong to this user and be unique.';
  end if;

  delete from public.free_active_recipe_slots where user_id = v_user_id;
  insert into public.free_active_recipe_slots (user_id, recipe_id, activated_at)
  select v_user_id, recipe_id, now()
  from unnest(coalesce(p_recipe_ids, '{}'::uuid[])) as selected(recipe_id);
end;
$$;

create or replace function public.set_free_active_import_slots(p_import_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_limit bigint;
  v_requested_count integer := coalesce(cardinality(p_import_ids), 0);
  v_valid_count integer;
  v_total_bytes bigint;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 3));

  select free_active_import_limit_bytes
    into v_limit
  from public.user_entitlements
  where user_id = v_user_id
    and not is_premium
    and legacy_archive_enabled
  for update;

  if v_limit is null then
    raise exception 'Only former Premium users can manage a cloud archive.';
  end if;

  select count(*), coalesce(sum(imports.bytes), 0)
    into v_valid_count, v_total_bytes
  from public.recipe_document_imports as imports
  where imports.user_id = v_user_id
    and imports.id = any(coalesce(p_import_ids, '{}'::uuid[]))
    and imports.deleted_at is null
    and imports.status in ('uploaded', 'processing', 'ready');

  if v_valid_count <> v_requested_count then
    raise exception 'Every active import must belong to this user and be unique.';
  end if;

  if v_total_bytes > v_limit then
    raise exception 'Free plan active import storage limit reached.';
  end if;

  delete from public.free_active_import_slots where user_id = v_user_id;
  insert into public.free_active_import_slots (user_id, recipe_document_import_id, activated_at)
  select v_user_id, import_id, now()
  from unnest(coalesce(p_import_ids, '{}'::uuid[])) as selected(import_id);
end;
$$;

alter table public.free_active_recipe_slots enable row level security;
alter table public.free_active_import_slots enable row level security;

create policy free_active_recipe_slots_select_own
  on public.free_active_recipe_slots
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy free_active_import_slots_select_own
  on public.free_active_import_slots
  for select
  to authenticated
  using (user_id = (select auth.uid()));

grant select on public.free_active_recipe_slots, public.free_active_import_slots to authenticated;
grant select, insert, update, delete on public.free_active_recipe_slots, public.free_active_import_slots to service_role;

revoke all on function public.seed_free_active_library_slots(uuid) from public, anon, authenticated;
revoke all on function public.set_free_active_recipe_slots(uuid[]) from public, anon;
grant execute on function public.set_free_active_recipe_slots(uuid[]) to authenticated, service_role;
revoke all on function public.set_free_active_import_slots(uuid[]) from public, anon;
grant execute on function public.set_free_active_import_slots(uuid[]) to authenticated, service_role;
