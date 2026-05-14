-- Cache auth.uid() once per statement in recipe ingredient RLS policies.
-- This resolves Supabase's Auth RLS Initialization Plan lint warning.

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
        and r.user_id = (select auth.uid())
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
        and r.user_id = (select auth.uid())
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
        and r.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.recipes r
      where r.id = recipe_ingredients.recipe_id
        and r.user_id = (select auth.uid())
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
        and r.user_id = (select auth.uid())
    )
  );
