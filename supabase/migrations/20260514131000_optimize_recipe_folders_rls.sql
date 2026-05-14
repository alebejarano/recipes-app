-- Cache auth.uid() once per statement in recipe folder RLS policies.
-- This resolves Supabase's Auth RLS Initialization Plan lint warning.

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
        and r.user_id = (select auth.uid())
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
        and r.user_id = (select auth.uid())
    )
    and exists (
      select 1
      from public.folders f
      where f.id = recipe_folders.folder_id
        and f.user_id = (select auth.uid())
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
        and r.user_id = (select auth.uid())
    )
  );
