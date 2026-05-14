-- Cache auth.uid() once per statement in folder owner RLS policies.
-- This resolves Supabase's Auth RLS Initialization Plan lint warning.

drop policy if exists folders_select_own on public.folders;
drop policy if exists folders_insert_own on public.folders;
drop policy if exists folders_update_own on public.folders;
drop policy if exists folders_delete_own on public.folders;

create policy folders_select_own
  on public.folders
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy folders_insert_own
  on public.folders
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy folders_update_own
  on public.folders
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy folders_delete_own
  on public.folders
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
