-- Premium is the sole authority for direct cloud reads and writes. Former
-- Premium Free users receive archive metadata only through the narrowly scoped
-- RPCs below; active Free content stays local to the device.

drop policy if exists recipes_select_own on public.recipes;
create policy recipes_select_premium_own
  on public.recipes for select to authenticated
  using ((select auth.uid()) = user_id and public.has_active_premium_access(user_id));

drop policy if exists ingredients_select_via_own_recipe on public.recipe_ingredients;
create policy ingredients_select_via_premium_recipe
  on public.recipe_ingredients for select to authenticated
  using (exists (
    select 1 from public.recipes r
    where r.id = recipe_ingredients.recipe_id
      and r.user_id = (select auth.uid())
      and public.has_active_premium_access(r.user_id)
  ));

drop policy if exists ingredients_insert_via_own_recipe on public.recipe_ingredients;
drop policy if exists ingredients_update_via_own_recipe on public.recipe_ingredients;
drop policy if exists ingredients_delete_via_own_recipe on public.recipe_ingredients;
create policy ingredients_insert_via_premium_recipe on public.recipe_ingredients for insert to authenticated
  with check (exists (
    select 1 from public.recipes r
    where r.id = recipe_ingredients.recipe_id and r.user_id = (select auth.uid())
      and public.has_active_premium_access(r.user_id)
  ));
create policy ingredients_update_via_premium_recipe on public.recipe_ingredients for update to authenticated
  using (exists (
    select 1 from public.recipes r
    where r.id = recipe_ingredients.recipe_id and r.user_id = (select auth.uid())
      and public.has_active_premium_access(r.user_id)
  ))
  with check (exists (
    select 1 from public.recipes r
    where r.id = recipe_ingredients.recipe_id and r.user_id = (select auth.uid())
      and public.has_active_premium_access(r.user_id)
  ));
create policy ingredients_delete_via_premium_recipe on public.recipe_ingredients for delete to authenticated
  using (exists (
    select 1 from public.recipes r
    where r.id = recipe_ingredients.recipe_id and r.user_id = (select auth.uid())
      and public.has_active_premium_access(r.user_id)
  ));

drop policy if exists recipe_folders_select_own on public.recipe_folders;
create policy recipe_folders_select_via_premium_recipe
  on public.recipe_folders for select to authenticated
  using (exists (
    select 1 from public.recipes r
    where r.id = recipe_folders.recipe_id
      and r.user_id = (select auth.uid())
      and public.has_active_premium_access(r.user_id)
  ));

drop policy if exists recipe_folders_insert_own on public.recipe_folders;
drop policy if exists recipe_folders_delete_own on public.recipe_folders;
create policy recipe_folders_insert_via_premium_recipe on public.recipe_folders for insert to authenticated
  with check (exists (
    select 1 from public.recipes r
    where r.id = recipe_folders.recipe_id and r.user_id = (select auth.uid())
      and public.has_active_premium_access(r.user_id)
  ));
create policy recipe_folders_delete_via_premium_recipe on public.recipe_folders for delete to authenticated
  using (exists (
    select 1 from public.recipes r
    where r.id = recipe_folders.recipe_id and r.user_id = (select auth.uid())
      and public.has_active_premium_access(r.user_id)
  ));

drop policy if exists folders_select_own on public.folders;
drop policy if exists folders_insert_own on public.folders;
drop policy if exists folders_update_own on public.folders;
drop policy if exists folders_delete_own on public.folders;
create policy folders_select_premium_own on public.folders for select to authenticated
  using ((select auth.uid()) = user_id and public.has_active_premium_access(user_id));
create policy folders_insert_premium_own on public.folders for insert to authenticated
  with check ((select auth.uid()) = user_id and public.has_active_premium_access(user_id));
create policy folders_update_premium_own on public.folders for update to authenticated
  using ((select auth.uid()) = user_id and public.has_active_premium_access(user_id))
  with check ((select auth.uid()) = user_id and public.has_active_premium_access(user_id));
create policy folders_delete_premium_own on public.folders for delete to authenticated
  using ((select auth.uid()) = user_id and public.has_active_premium_access(user_id));

drop policy if exists "Users can view their notes" on public.notes;
drop policy if exists "Users can insert their notes" on public.notes;
drop policy if exists "Users can update their notes" on public.notes;
drop policy if exists "Users can delete their notes" on public.notes;
create policy notes_select_premium_own on public.notes for select to authenticated
  using ((select auth.uid()) = user_id and public.has_active_premium_access(user_id));
create policy notes_insert_premium_own on public.notes for insert to authenticated
  with check ((select auth.uid()) = user_id and public.has_active_premium_access(user_id));
create policy notes_update_premium_own on public.notes for update to authenticated
  using ((select auth.uid()) = user_id and public.has_active_premium_access(user_id))
  with check ((select auth.uid()) = user_id and public.has_active_premium_access(user_id));
create policy notes_delete_premium_own on public.notes for delete to authenticated
  using ((select auth.uid()) = user_id and public.has_active_premium_access(user_id));

drop policy if exists shopping_lists_select_own on public.shopping_lists;
drop policy if exists shopping_lists_insert_own on public.shopping_lists;
drop policy if exists shopping_lists_update_own on public.shopping_lists;
drop policy if exists shopping_lists_delete_own on public.shopping_lists;
create policy shopping_lists_select_premium_own on public.shopping_lists for select to authenticated
  using ((select auth.uid()) = user_id and public.has_active_premium_access(user_id));
create policy shopping_lists_insert_premium_own on public.shopping_lists for insert to authenticated
  with check ((select auth.uid()) = user_id and public.has_active_premium_access(user_id));
create policy shopping_lists_update_premium_own on public.shopping_lists for update to authenticated
  using ((select auth.uid()) = user_id and public.has_active_premium_access(user_id))
  with check ((select auth.uid()) = user_id and public.has_active_premium_access(user_id));
create policy shopping_lists_delete_premium_own on public.shopping_lists for delete to authenticated
  using ((select auth.uid()) = user_id and public.has_active_premium_access(user_id));

drop policy if exists recipe_document_imports_select_own on public.recipe_document_imports;
drop policy if exists recipe_document_imports_soft_delete_own on public.recipe_document_imports;
create policy recipe_document_imports_select_premium_own
  on public.recipe_document_imports for select to authenticated
  using (user_id = (select auth.uid()) and public.has_active_premium_access(user_id));

create or replace function public.list_free_recipe_archive_metadata()
returns table (
  recipe_id uuid,
  title text,
  subtitle text,
  emoji text,
  image_url text,
  folder_names text[],
  updated_at timestamptz,
  created_at timestamptz
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
    recipes.created_at
  from public.recipes as recipes
  left join public.recipe_folders as joins on joins.recipe_id = recipes.id
  left join public.folders as folders on folders.id = joins.folder_id
  where recipes.user_id = v_user_id
    and not exists (
      select 1 from public.free_active_recipe_slots as slots
      where slots.user_id = v_user_id and slots.recipe_id = recipes.id
    )
  group by recipes.id
  order by recipes.updated_at desc, recipes.id desc;
end;
$$;

create or replace function public.list_free_import_archive_metadata()
returns table (
  import_id uuid,
  title text,
  original_file_name text,
  mime_type text,
  bytes bigint,
  status text,
  created_at timestamptz
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
  select imports.id, imports.title, imports.original_file_name, imports.mime_type,
    imports.bytes, imports.status, imports.created_at
  from public.recipe_document_imports as imports
  where imports.user_id = v_user_id
    and imports.deleted_at is null
    and imports.status in ('uploaded', 'processing', 'ready')
    and not exists (
      select 1 from public.free_active_import_slots as slots
      where slots.user_id = v_user_id
        and slots.recipe_document_import_id = imports.id
    )
  order by imports.updated_at desc, imports.id desc;
end;
$$;

create or replace function public.update_recipe_document_import_title(p_document_id uuid, p_title text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_title text := trim(p_title);
begin
  if v_user_id is null or not public.has_active_premium_access(v_user_id) then
    raise exception 'Premium plan required for cloud imports.';
  end if;
  if coalesce(v_title, '') = '' or char_length(v_title) > 120 then
    raise exception 'Import name must be between 1 and 120 characters.';
  end if;
  update public.recipe_document_imports
  set title = v_title
  where id = p_document_id and user_id = v_user_id and deleted_at is null;
  if not found then raise exception 'Document not found'; end if;
end;
$$;

create or replace function public.delete_recipe_document_import(p_document_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null or not public.has_active_premium_access(v_user_id) then
    raise exception 'Premium plan required for cloud imports.';
  end if;
  update public.recipe_document_imports
  set deleted_at = now(), status = 'deleted', failed_reason = null, updated_at = now()
  where id = p_document_id and user_id = v_user_id and deleted_at is null;
  if not found then raise exception 'Document not found'; end if;
end;
$$;

-- Block every direct Storage route. Active Free import downloads must use the
-- signed-URL Edge Function, which checks the active-import slots server-side.
drop policy if exists recipe_imports_insert_guarded on storage.objects;
drop policy if exists recipe_imports_select_own on storage.objects;
drop policy if exists recipe_imports_update_own on storage.objects;
drop policy if exists recipe_imports_delete_own on storage.objects;
create policy recipe_imports_insert_premium on storage.objects for insert to authenticated
  with check (bucket_id = 'recipe-imports'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and public.has_active_premium_access((select auth.uid())));
create policy recipe_imports_select_premium on storage.objects for select to authenticated
  using (bucket_id = 'recipe-imports'
    and owner_id = (select auth.uid()::text)
    and public.has_active_premium_access((select auth.uid())));
create policy recipe_imports_update_premium on storage.objects for update to authenticated
  using (bucket_id = 'recipe-imports' and owner_id = (select auth.uid()::text)
    and public.has_active_premium_access((select auth.uid())))
  with check (bucket_id = 'recipe-imports' and owner_id = (select auth.uid()::text)
    and public.has_active_premium_access((select auth.uid())));
create policy recipe_imports_delete_premium on storage.objects for delete to authenticated
  using (bucket_id = 'recipe-imports' and owner_id = (select auth.uid()::text)
    and public.has_active_premium_access((select auth.uid())));

drop policy if exists recipe_images_insert_guarded on storage.objects;
drop policy if exists recipe_images_update_own on storage.objects;
drop policy if exists recipe_images_delete_own on storage.objects;
create policy recipe_images_insert_premium on storage.objects for insert to authenticated
  with check (bucket_id = 'recipe-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and public.has_active_premium_access((select auth.uid())));
create policy recipe_images_update_premium on storage.objects for update to authenticated
  using (bucket_id = 'recipe-images' and owner_id = (select auth.uid()::text)
    and public.has_active_premium_access((select auth.uid())))
  with check (bucket_id = 'recipe-images' and owner_id = (select auth.uid()::text)
    and public.has_active_premium_access((select auth.uid())));
create policy recipe_images_delete_premium on storage.objects for delete to authenticated
  using (bucket_id = 'recipe-images' and owner_id = (select auth.uid()::text)
    and public.has_active_premium_access((select auth.uid())));

revoke all on function public.list_free_recipe_archive_metadata() from public, anon;
grant execute on function public.list_free_recipe_archive_metadata() to authenticated, service_role;
revoke all on function public.list_free_import_archive_metadata() from public, anon;
grant execute on function public.list_free_import_archive_metadata() to authenticated, service_role;
