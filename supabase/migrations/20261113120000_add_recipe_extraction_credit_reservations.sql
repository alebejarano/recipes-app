create table public.credit_reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  recipe_extraction_id uuid not null unique references public.recipe_extractions (id) on delete cascade,
  status text not null check (status in ('reserved', 'consumed', 'released')),
  period_starts_at date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index credit_reservations_user_period_status_index
  on public.credit_reservations (user_id, period_starts_at, status);

alter table public.credit_reservations enable row level security;
