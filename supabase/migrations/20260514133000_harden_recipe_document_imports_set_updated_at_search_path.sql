-- Harden the recipe document imports updated_at trigger helper.
-- This resolves Supabase's Function Search Path Mutable lint warning.

create or replace function public.recipe_document_imports_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;
