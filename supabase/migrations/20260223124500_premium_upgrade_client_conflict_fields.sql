alter table if exists public.recipes
  add column if not exists client_version integer not null default 1;

alter table if exists public.recipes
  add column if not exists client_updated_at timestamptz;

alter table if exists public.notes
  add column if not exists client_version integer not null default 1;

alter table if exists public.notes
  add column if not exists client_updated_at timestamptz;

alter table if exists public.folders
  add column if not exists client_version integer not null default 1;

alter table if exists public.folders
  add column if not exists client_updated_at timestamptz;

create index if not exists recipes_user_client_conflict_idx
  on public.recipes (user_id, client_version, client_updated_at desc);

create index if not exists notes_user_client_conflict_idx
  on public.notes (user_id, client_version, client_updated_at desc);

create index if not exists folders_user_client_conflict_idx
  on public.folders (user_id, client_version, client_updated_at desc);
