-- Store account-creation acceptance separately from optional marketing consent.
-- These records are written by the database at signup, not by the client.
create table public.legal_document_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document text not null check (document in ('terms_of_service', 'privacy_policy')),
  document_version text not null,
  action text not null check (action in ('agreed', 'acknowledged')),
  source text not null default 'account_creation',
  accepted_at timestamptz not null default now(),
  unique (user_id, document, document_version)
);

create index legal_document_acceptances_user_id_accepted_at_idx
  on public.legal_document_acceptances (user_id, accepted_at desc);

alter table public.legal_document_acceptances enable row level security;

create policy "Users can read their legal document acceptance history"
  on public.legal_document_acceptances
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on table public.legal_document_acceptances from anon, authenticated;
grant select on table public.legal_document_acceptances to authenticated;
grant select, insert, update, delete on table public.legal_document_acceptances to service_role;

create or replace function public.record_new_user_legal_document_acceptance()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.legal_document_acceptances (
    user_id,
    document,
    document_version,
    action,
    source
  )
  values
    (new.id, 'terms_of_service', '2026-07-15', 'agreed', 'account_creation'),
    (new.id, 'privacy_policy', '2026-07-15', 'acknowledged', 'account_creation');

  return new;
end;
$$;

revoke all on function public.record_new_user_legal_document_acceptance()
  from public, anon, authenticated, service_role;

drop trigger if exists record_new_user_legal_document_acceptance on auth.users;
create trigger record_new_user_legal_document_acceptance
  after insert on auth.users
  for each row
  execute function public.record_new_user_legal_document_acceptance();
