-- Harden the premium JSON parsing helper flagged by Supabase lint.
-- This resolves Supabase's Function Search Path Mutable warning.

create or replace function public.premium_parse_json_array(raw text)
returns jsonb
language plpgsql
immutable
set search_path = ''
as $$
declare
  parsed jsonb;
begin
  if raw is null or pg_catalog.btrim(raw) = '' then
    return '[]'::jsonb;
  end if;

  parsed := raw::jsonb;
  if pg_catalog.jsonb_typeof(parsed) <> 'array' then
    return '[]'::jsonb;
  end if;

  return parsed;
exception
  when others then
    return '[]'::jsonb;
end;
$$;
