alter table if exists public.recipes
  add column if not exists meal_times text[] not null default '{}';
