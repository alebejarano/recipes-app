-- Cache auth.uid() once per statement in note owner RLS policies.
-- This resolves Supabase's Auth RLS Initialization Plan lint warning.

drop policy if exists "Users can view their notes" on public.notes;
drop policy if exists "Users can insert their notes" on public.notes;
drop policy if exists "Users can update their notes" on public.notes;
drop policy if exists "Users can delete their notes" on public.notes;

create policy "Users can view their notes"
  on public.notes
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their notes"
  on public.notes
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their notes"
  on public.notes
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their notes"
  on public.notes
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
