-- Codify owner-based RLS for the core synced data tables.
-- These policies match the currently verified project behavior: users can
-- access only rows they own, and recipe child rows are scoped via parent recipe.

alter table if exists public.recipes enable row level security;
alter table if exists public.notes enable row level security;
alter table if exists public.folders enable row level security;
alter table if exists public.recipe_ingredients enable row level security;
alter table if exists public.recipe_folders enable row level security;

drop policy if exists recipes_select_own on public.recipes;
drop policy if exists recipes_insert_own on public.recipes;
drop policy if exists recipes_update_own on public.recipes;
drop policy if exists recipes_delete_own on public.recipes;

create policy recipes_select_own
  on public.recipes
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy recipes_insert_own
  on public.recipes
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy recipes_update_own
  on public.recipes
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy recipes_delete_own
  on public.recipes
  for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can view their notes" on public.notes;
drop policy if exists "Users can insert their notes" on public.notes;
drop policy if exists "Users can update their notes" on public.notes;
drop policy if exists "Users can delete their notes" on public.notes;

create policy "Users can view their notes"
  on public.notes
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their notes"
  on public.notes
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their notes"
  on public.notes
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their notes"
  on public.notes
  for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists folders_select_own on public.folders;
drop policy if exists folders_insert_own on public.folders;
drop policy if exists folders_update_own on public.folders;
drop policy if exists folders_delete_own on public.folders;

create policy folders_select_own
  on public.folders
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy folders_insert_own
  on public.folders
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy folders_update_own
  on public.folders
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy folders_delete_own
  on public.folders
  for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists ingredients_select_via_own_recipe on public.recipe_ingredients;
drop policy if exists ingredients_insert_via_own_recipe on public.recipe_ingredients;
drop policy if exists ingredients_update_via_own_recipe on public.recipe_ingredients;
drop policy if exists ingredients_delete_via_own_recipe on public.recipe_ingredients;

create policy ingredients_select_via_own_recipe
  on public.recipe_ingredients
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.recipes r
      where r.id = recipe_ingredients.recipe_id
        and r.user_id = auth.uid()
    )
  );

create policy ingredients_insert_via_own_recipe
  on public.recipe_ingredients
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.recipes r
      where r.id = recipe_ingredients.recipe_id
        and r.user_id = auth.uid()
    )
  );

create policy ingredients_update_via_own_recipe
  on public.recipe_ingredients
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.recipes r
      where r.id = recipe_ingredients.recipe_id
        and r.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.recipes r
      where r.id = recipe_ingredients.recipe_id
        and r.user_id = auth.uid()
    )
  );

create policy ingredients_delete_via_own_recipe
  on public.recipe_ingredients
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.recipes r
      where r.id = recipe_ingredients.recipe_id
        and r.user_id = auth.uid()
    )
  );

drop policy if exists recipe_folders_select_own on public.recipe_folders;
drop policy if exists recipe_folders_insert_own on public.recipe_folders;
drop policy if exists recipe_folders_delete_own on public.recipe_folders;

create policy recipe_folders_select_own
  on public.recipe_folders
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.recipes r
      where r.id = recipe_folders.recipe_id
        and r.user_id = auth.uid()
    )
  );

create policy recipe_folders_insert_own
  on public.recipe_folders
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.recipes r
      where r.id = recipe_folders.recipe_id
        and r.user_id = auth.uid()
    )
    and exists (
      select 1
      from public.folders f
      where f.id = recipe_folders.folder_id
        and f.user_id = auth.uid()
    )
  );

create policy recipe_folders_delete_own
  on public.recipe_folders
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.recipes r
      where r.id = recipe_folders.recipe_id
        and r.user_id = auth.uid()
    )
  );
