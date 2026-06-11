-- The delete-account Edge Function removes import usage that is not linked to
-- auth.users before deleting the user. Keep all client roles blocked while
-- allowing that service-role cleanup.
grant delete on table public.import_upload_events to service_role;
grant delete on table public.import_upload_user_state to service_role;
