-- V3: explicit database-owned generic ingredient families. The existing
-- recipe_conversion_ingredients table remains the sole conversion catalog.
create table if not exists public.ingredient_families (
  id text primary key,
  name text not null,
  aliases text[] not null default '{}',
  default_ingredient_id uuid references public.recipe_conversion_ingredients(id),
  is_active boolean not null default true
);

alter table public.recipe_conversion_ingredients
  add column if not exists family_id text references public.ingredient_families(id);
create index if not exists recipe_conversion_ingredients_family_idx on public.recipe_conversion_ingredients(family_id);

insert into public.ingredient_families (id, name, aliases) values
  ('flour', 'Flour', array['flour', 'plain flour', 'AP flour', 'white flour']),
  ('sugar', 'Sugar', array['sugar', 'white sugar', 'granulated sugar', 'table sugar']),
  ('oil', 'Cooking oil', array['oil', 'cooking oil', 'neutral oil', 'vegetable oil', 'canola oil', 'rapeseed oil', 'sunflower oil', 'avocado oil', 'grapeseed oil']),
  ('milk', 'Milk', array['milk', 'whole milk']),
  ('cream', 'Cream', array['cream', 'heavy cream', 'heavy whipping cream', 'whipping cream']),
  ('yogurt', 'Yogurt', array['yogurt', 'plain yogurt']),
  ('butter', 'Butter', array['butter', 'unsalted butter', 'salted butter']),
  ('salt', 'Salt', array['salt', 'table salt', 'fine salt']),
  ('rice', 'Rice', array['rice', 'white rice', 'long grain rice'])
on conflict (id) do update set name = excluded.name, aliases = excluded.aliases;

-- Specific names get their own profile and always resolve before a family alias.
insert into public.recipe_conversion_ingredients (canonical_name, category, family_id, aliases, search_terms) values
  ('granulated sugar', 'sugar', 'sugar', array['white sugar', 'table sugar'], array['granulated sugar', 'white sugar', 'table sugar']),
  ('caster sugar', 'sugar', 'sugar', array['superfine sugar', 'castor sugar'], array['caster sugar', 'superfine sugar', 'castor sugar']),
  ('brown sugar, packed', 'sugar', 'sugar', array['light brown sugar', 'dark brown sugar'], array['brown sugar, packed', 'light brown sugar', 'dark brown sugar']),
  ('powdered sugar', 'sugar', 'sugar', array['icing sugar', 'confectioners sugar'], array['powdered sugar', 'icing sugar', 'confectioners sugar']),
  ('cooking oil', 'fat', 'oil', array['neutral oil', 'vegetable oil', 'canola oil', 'rapeseed oil', 'sunflower oil', 'avocado oil', 'grapeseed oil'], array['cooking oil', 'neutral oil', 'vegetable oil', 'canola oil', 'rapeseed oil', 'sunflower oil', 'avocado oil', 'grapeseed oil']),
  ('heavy cream', 'dairy', 'cream', array['heavy whipping cream', 'double cream'], array['heavy cream', 'heavy whipping cream', 'double cream']),
  ('plain yogurt', 'dairy', 'yogurt', array['natural yogurt'], array['plain yogurt', 'natural yogurt']),
  ('greek yogurt', 'dairy', 'yogurt', array[]::text[], array['greek yogurt']),
  ('salt, table', 'seasoning', 'salt', array['table salt', 'fine salt'], array['salt, table', 'table salt', 'fine salt']),
  ('kosher salt', 'seasoning', 'salt', array[]::text[], array['kosher salt']),
  ('white rice, long grain, raw', 'grain', 'rice', array['long grain rice'], array['white rice, long grain, raw', 'long grain rice'])
on conflict (canonical_name) do update set category = excluded.category, family_id = excluded.family_id, aliases = excluded.aliases, search_terms = excluded.search_terms;

update public.recipe_conversion_ingredients
set family_id = case canonical_name
  when 'all-purpose flour' then 'flour' when 'bread flour' then 'flour' when 'whole wheat flour' then 'flour'
  when 'butter' then 'butter' when 'milk, whole' then 'milk' when 'olive oil' then 'oil'
  else family_id end;

insert into public.ingredient_unit_weights (ingredient_id, unit_id, grams_per_unit, preparation, source_name, source_reference, confidence, notes)
select ingredient.id, 'cup', seed.grams, 'US level cup', seed.source_name, seed.source_reference, seed.confidence, 'Tablespoon and teaspoon values are derived from the US-cup anchor.'
from (values
  ('granulated sugar', 200::numeric, 'USDA FDC', 'USDA FDC; cup', 'high'),
  ('caster sugar', 200::numeric, 'typical culinary reference', 'typical culinary reference', 'medium'),
  ('brown sugar, packed', 220::numeric, 'USDA FDC', 'USDA FDC; packed cup', 'high'),
  ('powdered sugar', 120::numeric, 'USDA FDC', 'USDA FDC; unsifted cup', 'high'),
  ('cooking oil', 218::numeric, 'typical culinary reference', 'generic neutral cooking oil approximation', 'medium'),
  ('heavy cream', 238::numeric, 'USDA FDC', 'USDA FDC; cup', 'high'),
  ('plain yogurt', 245::numeric, 'USDA FDC', 'USDA FDC; cup', 'high'),
  ('greek yogurt', 280::numeric, 'typical culinary reference', 'typical culinary reference', 'medium'),
  ('salt, table', 288::numeric, 'typical culinary reference', 'typical culinary reference', 'medium'),
  ('kosher salt', 150::numeric, 'typical culinary reference', 'Diamond Crystal kosher salt', 'medium'),
  ('white rice, long grain, raw', 185::numeric, 'USDA FDC', 'USDA FDC; cup', 'high')
) as seed(canonical_name, grams, source_name, source_reference, confidence)
join public.recipe_conversion_ingredients ingredient on ingredient.canonical_name = seed.canonical_name
on conflict (ingredient_id, unit_id, preparation) do update set grams_per_unit = excluded.grams_per_unit, source_name = excluded.source_name, source_reference = excluded.source_reference, confidence = excluded.confidence, notes = excluded.notes;

insert into public.ingredient_unit_weights (ingredient_id, unit_id, grams_per_unit, preparation, source_name, source_reference, confidence, notes)
select weight.ingredient_id, derived.unit_id, weight.grams_per_unit / derived.divisor, weight.preparation, 'Derived from cup weight', weight.source_reference, weight.confidence, 'Derived mathematically from the ingredient''s US-cup anchor.'
from public.ingredient_unit_weights weight
cross join (values ('tbsp', 16::numeric), ('tsp', 48::numeric)) as derived(unit_id, divisor)
where weight.unit_id = 'cup'
on conflict (ingredient_id, unit_id, preparation) do update set grams_per_unit = excluded.grams_per_unit, source_name = excluded.source_name, source_reference = excluded.source_reference, confidence = excluded.confidence, notes = excluded.notes;

update public.ingredient_families family
set default_ingredient_id = ingredient.id
from public.recipe_conversion_ingredients ingredient
where (family.id, ingredient.canonical_name) in (
  ('flour', 'all-purpose flour'), ('sugar', 'granulated sugar'), ('oil', 'cooking oil'),
  ('milk', 'milk, whole'), ('cream', 'heavy cream'), ('yogurt', 'plain yogurt'),
  ('butter', 'butter'), ('salt', 'salt, table'), ('rice', 'white rice, long grain, raw')
);

alter table public.ingredient_families enable row level security;
create policy "ingredient families readable" on public.ingredient_families for select using (is_active = true);
grant select on public.ingredient_families to anon, authenticated;
