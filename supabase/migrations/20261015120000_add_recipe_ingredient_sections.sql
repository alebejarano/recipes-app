alter table public.recipe_ingredients
  add column if not exists kind text not null default 'ingredient'
  check (kind in ('ingredient', 'section'));
