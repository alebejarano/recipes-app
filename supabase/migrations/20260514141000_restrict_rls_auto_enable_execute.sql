-- Restrict the live administrative SECURITY DEFINER helper so it cannot be
-- called anonymously through /rest/v1/rpc/rls_auto_enable.
-- The function is present in the remote schema, but not all local databases
-- created from these migrations have it, so keep this migration replay-safe.

do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'rls_auto_enable'
      and pg_get_function_identity_arguments(p.oid) = ''
  ) then
    revoke all on function public.rls_auto_enable() from public, anon, authenticated;
    grant execute on function public.rls_auto_enable() to service_role;
  end if;
end
$$;
