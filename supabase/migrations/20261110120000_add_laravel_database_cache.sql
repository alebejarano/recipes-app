-- Laravel's database cache driver uses both tables. Keep these in Supabase
-- migrations so development and production are provisioned identically.
create table public.cache (
  key varchar(255) primary key,
  value text not null,
  expiration integer not null
);

create index cache_expiration_index on public.cache (expiration);

create table public.cache_locks (
  key varchar(255) primary key,
  owner varchar(255) not null,
  expiration integer not null
);

create index cache_locks_expiration_index on public.cache_locks (expiration);

-- Laravel connects with its server-side database role. RLS prevents browser
-- clients from accessing operational queue/cache data through the Data API.
alter table public.cache enable row level security;
alter table public.cache_locks enable row level security;
