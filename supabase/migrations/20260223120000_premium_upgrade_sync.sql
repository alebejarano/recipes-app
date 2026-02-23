create table if not exists public.user_entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null check (plan in ('free', 'premium')),
  billing_cycle text not null check (billing_cycle in ('month', 'year')),
  activated_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.premium_upgrade_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  idempotency_key text not null,
  status text not null check (status in ('running', 'completed', 'failed')),
  response_json jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);

alter table if exists public.recipes
  add column if not exists client_id text;

alter table if exists public.notes
  add column if not exists client_id text;

alter table if exists public.folders
  add column if not exists client_id text;

alter table if exists public.notes
  add column if not exists deleted_at timestamptz;

alter table if exists public.folders
  add column if not exists deleted_at timestamptz;

create unique index if not exists recipes_user_client_id_uniq
  on public.recipes (user_id, client_id)
  where client_id is not null;

create unique index if not exists notes_user_client_id_uniq
  on public.notes (user_id, client_id)
  where client_id is not null;

create unique index if not exists folders_user_client_id_uniq
  on public.folders (user_id, client_id)
  where client_id is not null;

create index if not exists notes_user_deleted_idx
  on public.notes (user_id, deleted_at);

create index if not exists folders_user_deleted_idx
  on public.folders (user_id, deleted_at);
