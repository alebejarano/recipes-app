create table if not exists public.shopping_lists (
  user_id uuid primary key references auth.users(id) on delete cascade,
  items jsonb not null default '[]'::jsonb check (jsonb_typeof(items) = 'array'),
  updated_at timestamptz not null default now()
);

alter table public.shopping_lists enable row level security;

create or replace function public.shopping_lists_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger shopping_lists_set_updated_at
before update on public.shopping_lists
for each row execute function public.shopping_lists_set_updated_at();

create policy shopping_lists_select_own
  on public.shopping_lists
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy shopping_lists_insert_own
  on public.shopping_lists
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy shopping_lists_update_own
  on public.shopping_lists
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy shopping_lists_delete_own
  on public.shopping_lists
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on table public.shopping_lists to authenticated;
grant select, insert, update, delete on table public.shopping_lists to service_role;
revoke all on table public.shopping_lists from anon;
