-- Cache auth.uid() once per statement in recipe owner RLS policies.
-- This resolves Supabase's Auth RLS Initialization Plan lint warning.

drop policy if exists recipes_select_own on public.recipes;
drop policy if exists recipes_insert_own on public.recipes;
drop policy if exists recipes_update_own on public.recipes;
drop policy if exists recipes_delete_own on public.recipes;

create policy recipes_select_own
  on public.recipes
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy recipes_insert_own
  on public.recipes
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy recipes_update_own
  on public.recipes
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy recipes_delete_own
  on public.recipes
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
