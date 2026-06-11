-- PostgreSQL requires SELECT on columns referenced by a DELETE filter.
-- The delete-account Edge Function filters both cleanup queries by user_id.
grant select (user_id) on table public.import_upload_events to service_role;
grant select (user_id) on table public.import_upload_user_state to service_role;
