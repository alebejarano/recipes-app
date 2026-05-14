-- Harden the premium merge conflict helper flagged by Supabase lint.
-- This resolves Supabase's Function Search Path Mutable warning.

create or replace function public.premium_should_apply_incoming(
  p_existing_version integer,
  p_existing_updated_at timestamptz,
  p_incoming_version integer,
  p_incoming_updated_at timestamptz
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select
    case
      when coalesce(p_incoming_version, 1) > coalesce(p_existing_version, 1) then true
      when coalesce(p_incoming_version, 1) < coalesce(p_existing_version, 1) then false
      else coalesce(p_incoming_updated_at, pg_catalog.to_timestamp(0)) > coalesce(p_existing_updated_at, pg_catalog.to_timestamp(0))
    end;
$$;
