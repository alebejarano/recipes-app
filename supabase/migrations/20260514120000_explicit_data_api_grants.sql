-- Supabase Data API grants must be explicit for new public tables.
-- Keep anonymous table access closed; authenticated access is still constrained
-- by the RLS policies declared in earlier migrations.

alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables from anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke usage, select on sequences from anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke execute on functions from public;

grant select, insert, update, delete on table public.recipes to authenticated;
grant select, insert, update, delete on table public.notes to authenticated;
grant select, insert, update, delete on table public.folders to authenticated;
grant select, insert, update, delete on table public.recipe_ingredients to authenticated;
grant select, insert, update, delete on table public.recipe_folders to authenticated;

grant select on table public.user_entitlements to authenticated;
grant select on table public.recipe_document_imports to authenticated;

grant select, insert, update, delete on table public.recipes to service_role;
grant select, insert, update, delete on table public.notes to service_role;
grant select, insert, update, delete on table public.folders to service_role;
grant select, insert, update, delete on table public.recipe_ingredients to service_role;
grant select, insert, update, delete on table public.recipe_folders to service_role;
grant select, insert, update, delete on table public.user_entitlements to service_role;
grant select, insert, update, delete on table public.premium_upgrade_requests to service_role;
grant select, insert, update, delete on table public.recipe_document_imports to service_role;

revoke all on table public.recipes from anon;
revoke all on table public.notes from anon;
revoke all on table public.folders from anon;
revoke all on table public.recipe_ingredients from anon;
revoke all on table public.recipe_folders from anon;
revoke all on table public.user_entitlements from anon;
revoke all on table public.premium_upgrade_requests from anon;
revoke all on table public.recipe_document_imports from anon;
revoke all on table public.import_upload_events from anon, authenticated, service_role;
revoke all on table public.import_upload_user_state from anon, authenticated, service_role;

revoke all on function public.get_recipe_document_import_usage() from public, anon;
grant execute on function public.get_recipe_document_import_usage() to authenticated, service_role;

revoke all on function public.delete_recipe_document_import(uuid) from public, anon;
grant execute on function public.delete_recipe_document_import(uuid) to authenticated, service_role;

revoke all on function public.list_recipe_document_imports_page(integer, timestamptz, uuid) from public, anon, authenticated;
revoke all on function public.recipe_document_imports_set_updated_at() from public, anon, authenticated;
revoke all on function public.premium_should_apply_incoming(integer, timestamptz, integer, timestamptz) from public, anon, authenticated;
revoke all on function public.premium_parse_json_array(text) from public, anon, authenticated;

revoke all on function public.begin_import_upload_guard(uuid, bigint) from public, anon, authenticated;
grant execute on function public.begin_import_upload_guard(uuid, bigint) to service_role;

revoke all on function public.finish_import_upload_guard(uuid, text, text) from public, anon, authenticated;
grant execute on function public.finish_import_upload_guard(uuid, text, text) to service_role;

revoke all on function public.premium_upgrade_merge(uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.premium_upgrade_merge(uuid, text, jsonb) to service_role;

revoke all on function public.reserve_recipe_document_import(uuid, text, text, text, text, text, bigint, text, text) from public, anon, authenticated;
grant execute on function public.reserve_recipe_document_import(uuid, text, text, text, text, text, bigint, text, text) to service_role;

revoke all on function public.mark_recipe_document_import_uploaded(uuid, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.mark_recipe_document_import_uploaded(uuid, uuid, jsonb) to service_role;

revoke all on function public.mark_recipe_document_import_failed(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.mark_recipe_document_import_failed(uuid, uuid, text) to service_role;

revoke all on function public.reconcile_recipe_document_imports(integer, boolean) from public, anon, authenticated;
grant execute on function public.reconcile_recipe_document_imports(integer, boolean) to service_role;
