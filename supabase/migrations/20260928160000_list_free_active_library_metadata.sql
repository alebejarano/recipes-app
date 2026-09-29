-- Former Premium members need one inventory to deliberately choose their
-- active Free library. This exposes metadata only; recipe bodies and files
-- remain protected by the existing Premium-only policies.

create or replace function public.list_free_recipe_library_metadata()
returns table (
  recipe_id uuid,
  title text,
  subtitle text,
  emoji text,
  image_url text,
  folder_names text[],
  updated_at timestamptz,
  created_at timestamptz,
  is_active boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null or not exists (
    select 1 from public.user_entitlements
    where user_id = v_user_id and not is_premium and legacy_archive_enabled
  ) then
    raise exception 'A legacy Free library is required.';
  end if;

  return query
  select
    recipes.id,
    recipes.title,
    recipes.subtitle,
    recipes.emoji,
    recipes.image_url,
    coalesce(array_agg(distinct folders.name) filter (where folders.name is not null), '{}'::text[]),
    recipes.updated_at,
    recipes.created_at,
    exists (
      select 1 from public.free_active_recipe_slots as slots
      where slots.user_id = v_user_id and slots.recipe_id = recipes.id
    )
  from public.recipes as recipes
  left join public.recipe_folders as joins on joins.recipe_id = recipes.id
  left join public.folders as folders on folders.id = joins.folder_id
  where recipes.user_id = v_user_id
  group by recipes.id
  order by is_active desc, recipes.updated_at desc, recipes.id desc;
end;
$$;

create or replace function public.list_free_import_library_metadata()
returns table (
  import_id uuid,
  title text,
  original_file_name text,
  bytes bigint,
  created_at timestamptz,
  is_active boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null or not exists (
    select 1 from public.user_entitlements
    where user_id = v_user_id and not is_premium and legacy_archive_enabled
  ) then
    raise exception 'A legacy Free library is required.';
  end if;

  return query
  select
    imports.id,
    imports.title,
    imports.original_file_name,
    imports.bytes,
    imports.created_at,
    exists (
      select 1 from public.free_active_import_slots as slots
      where slots.user_id = v_user_id and slots.recipe_document_import_id = imports.id
    )
  from public.recipe_document_imports as imports
  where imports.user_id = v_user_id
    and imports.deleted_at is null
    and imports.status in ('uploaded', 'processing', 'ready')
  order by is_active desc, imports.updated_at desc, imports.id desc;
end;
$$;

revoke all on function public.list_free_recipe_library_metadata() from public, anon;
grant execute on function public.list_free_recipe_library_metadata() to authenticated, service_role;
revoke all on function public.list_free_import_library_metadata() from public, anon;
grant execute on function public.list_free_import_library_metadata() to authenticated, service_role;
