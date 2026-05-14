-- Harden the recipe trigger helper flagged by Supabase lint.
-- The function is present in the remote schema, but not all local databases
-- created from these migrations have it, so keep this migration replay-safe.

do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'set_recipe_user_id'
      and pg_get_function_identity_arguments(p.oid) = ''
  ) then
    alter function public.set_recipe_user_id()
      set search_path = '';
  end if;
end
$$;
