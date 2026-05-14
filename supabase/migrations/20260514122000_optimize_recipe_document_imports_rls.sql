-- Cache auth.uid() once per statement in the recipe document imports RLS policy.
-- This resolves Supabase's Auth RLS Initialization Plan lint warning.

drop policy if exists recipe_document_imports_select_own
  on public.recipe_document_imports;

create policy recipe_document_imports_select_own
  on public.recipe_document_imports
  for select
  to authenticated
  using (user_id = (select auth.uid()));
