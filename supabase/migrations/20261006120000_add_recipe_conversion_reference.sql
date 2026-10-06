-- Recipe conversion reference data. This deliberately uses a distinct name from
-- public.recipe_ingredients, which already stores a user's recipe rows.
create extension if not exists pgcrypto;

create table if not exists public.recipe_units (
  id text primary key,
  dimension text not null check (dimension in ('mass', 'volume', 'temperature', 'count')),
  system text not null check (system in ('metric', 'us_customary', 'imperial', 'neutral')),
  name text not null,
  symbol text not null,
  aliases text[] not null default '{}',
  to_base_factor numeric,
  base_unit_id text,
  sort_order integer not null default 0,
  is_active boolean not null default true
);

create table if not exists public.recipe_conversion_ingredients (
  id uuid primary key default gen_random_uuid(),
  canonical_name text not null unique,
  category text,
  aliases text[] not null default '{}',
  search_terms text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.ingredient_unit_weights (
  id uuid primary key default gen_random_uuid(),
  ingredient_id uuid not null references public.recipe_conversion_ingredients(id) on delete cascade,
  unit_id text not null references public.recipe_units(id),
  grams_per_unit numeric not null check (grams_per_unit > 0),
  preparation text,
  source_name text not null,
  source_reference text,
  confidence text not null check (confidence in ('high', 'medium', 'low')),
  notes text,
  created_at timestamptz not null default now(),
  unique (ingredient_id, unit_id, preparation)
);

create index if not exists recipe_conversion_ingredients_aliases_gin on public.recipe_conversion_ingredients using gin (aliases);
create index if not exists ingredient_unit_weights_lookup_idx on public.ingredient_unit_weights (ingredient_id, unit_id);

insert into public.recipe_units (id, dimension, system, name, symbol, aliases, to_base_factor, base_unit_id, sort_order) values
  ('g', 'mass', 'metric', 'gram', 'g', array['gram', 'grams'], 1, 'g', 10),
  ('kg', 'mass', 'metric', 'kilogram', 'kg', array['kilogram', 'kilograms'], 1000, 'g', 20),
  ('oz', 'mass', 'us_customary', 'ounce', 'oz', array['ounce', 'ounces'], 28.349523125, 'g', 30),
  ('lb', 'mass', 'us_customary', 'pound', 'lb', array['pound', 'pounds', 'lbs'], 453.59237, 'g', 40),
  ('ml', 'volume', 'metric', 'milliliter', 'ml', array['milliliter', 'milliliters', 'millilitre', 'millilitres'], 1, 'ml', 50),
  ('l', 'volume', 'metric', 'liter', 'L', array['liter', 'liters', 'litre', 'litres'], 1000, 'ml', 60),
  ('tsp', 'volume', 'us_customary', 'teaspoon', 'tsp', array['teaspoon', 'teaspoons'], 4.92892159375, 'ml', 70),
  ('tbsp', 'volume', 'us_customary', 'tablespoon', 'tbsp', array['tablespoon', 'tablespoons', 'tbs'], 14.78676478125, 'ml', 80),
  ('cup', 'volume', 'us_customary', 'US cup', 'cup', array['cup', 'cups', 'US cup', 'US cups'], 236.5882365, 'ml', 90),
  ('pint', 'volume', 'us_customary', 'US pint', 'pt', array['pint', 'pints'], 473.176473, 'ml', 100),
  ('quart', 'volume', 'us_customary', 'US quart', 'qt', array['quart', 'quarts'], 946.352946, 'ml', 110),
  ('gallon', 'volume', 'us_customary', 'US gallon', 'gal', array['gallon', 'gallons'], 3785.411784, 'ml', 120),
  ('celsius', 'temperature', 'metric', 'Celsius', '°C', array['C', 'celsius', '°C'], null, null, 130),
  ('fahrenheit', 'temperature', 'us_customary', 'Fahrenheit', '°F', array['F', 'fahrenheit', '°F'], null, null, 140),
  ('count', 'count', 'neutral', 'count', '', array['piece', 'pieces', 'item', 'items'], 1, 'count', 150)
on conflict (id) do update set name = excluded.name, symbol = excluded.symbol, aliases = excluded.aliases, to_base_factor = excluded.to_base_factor, base_unit_id = excluded.base_unit_id, sort_order = excluded.sort_order;

-- Cup anchors are the supplied reference data. tbsp/tsp are derived below rather
-- than independently rounded. Density remains an estimate, not physical truth.
insert into public.recipe_conversion_ingredients (canonical_name, category, aliases, search_terms) values
  ('all-purpose flour', 'flour', array['flour', 'plain flour', 'AP flour', 'white flour'], array['all-purpose flour', 'flour', 'plain flour', 'AP flour', 'white flour']),
  ('bread flour', 'flour', array['strong flour'], array['bread flour', 'strong flour']),
  ('whole wheat flour', 'flour', array['wholemeal flour', 'wholemeal'], array['whole wheat flour', 'wholemeal flour', 'wholemeal']),
  ('granulated sugar', 'sugar', array['white sugar', 'caster sugar'], array['granulated sugar', 'white sugar', 'caster sugar']),
  ('butter', 'fat', array['unsalted butter', 'salted butter'], array['butter', 'unsalted butter', 'salted butter']),
  ('olive oil', 'fat', array[]::text[], array['olive oil']),
  ('milk, whole', 'dairy', array['whole milk'], array['milk, whole', 'whole milk']),
  ('honey', 'sweetener', array[]::text[], array['honey']),
  ('maple syrup', 'sweetener', array['pure maple syrup'], array['maple syrup', 'pure maple syrup']),
  ('water', 'liquid', array[]::text[], array['water']),
  ('cocoa powder', 'powder', array['unsweetened cocoa'], array['cocoa powder', 'unsweetened cocoa']),
  ('almond flour', 'flour', array[]::text[], array['almond flour'])
on conflict (canonical_name) do update set category = excluded.category, aliases = excluded.aliases, search_terms = excluded.search_terms;

insert into public.ingredient_unit_weights (ingredient_id, unit_id, grams_per_unit, preparation, source_name, source_reference, confidence)
select ingredient.id, data.unit_id, data.grams_per_unit, 'as specified by source/reference', data.source_name, data.source_reference, data.confidence
from (values
  ('all-purpose flour', 'cup', 125::numeric, 'USDA FDC', 'USDA FDC; level cup', 'high'),
  ('bread flour', 'cup', 137::numeric, 'USDA FDC', 'USDA FDC; cup', 'high'),
  ('whole wheat flour', 'cup', 120::numeric, 'USDA FDC', 'USDA FDC; cup', 'high'),
  ('granulated sugar', 'cup', 200::numeric, 'USDA FDC', 'USDA FDC; cup', 'high'),
  ('butter', 'cup', 227::numeric, 'USDA FDC', 'USDA FDC; cup', 'high'),
  ('olive oil', 'cup', 216::numeric, 'typical culinary reference', 'typical culinary reference', 'medium'),
  ('milk, whole', 'cup', 244::numeric, 'USDA FDC', 'USDA FDC; cup', 'high'),
  ('honey', 'cup', 339::numeric, 'USDA FDC', 'USDA FDC; cup', 'high'),
  ('maple syrup', 'cup', 315::numeric, 'USDA FDC', 'USDA FDC; cup', 'high'),
  ('water', 'cup', 236.588::numeric, 'US customary cup volume', 'US customary cup volume', 'high'),
  ('cocoa powder', 'cup', 86::numeric, 'USDA FDC', 'USDA FDC; cup', 'high'),
  ('almond flour', 'cup', 96::numeric, 'typical culinary reference', 'typical culinary reference', 'medium')
) as data(canonical_name, unit_id, grams_per_unit, source_name, source_reference, confidence)
join public.recipe_conversion_ingredients ingredient on ingredient.canonical_name = data.canonical_name
on conflict (ingredient_id, unit_id, preparation) do update set grams_per_unit = excluded.grams_per_unit, source_name = excluded.source_name, source_reference = excluded.source_reference, confidence = excluded.confidence;

insert into public.ingredient_unit_weights (ingredient_id, unit_id, grams_per_unit, preparation, source_name, source_reference, confidence, notes)
select weight.ingredient_id, derived.unit_id, weight.grams_per_unit / derived.divisor, weight.preparation, 'Derived from cup weight', weight.source_reference, weight.confidence, 'Derived mathematically from the ingredient''s US-cup anchor.'
from public.ingredient_unit_weights weight
cross join (values ('tbsp', 16::numeric), ('tsp', 48::numeric)) as derived(unit_id, divisor)
where weight.unit_id = 'cup'
on conflict (ingredient_id, unit_id, preparation) do update set grams_per_unit = excluded.grams_per_unit, source_name = excluded.source_name, source_reference = excluded.source_reference, confidence = excluded.confidence, notes = excluded.notes;

alter table public.recipe_units enable row level security;
alter table public.recipe_conversion_ingredients enable row level security;
alter table public.ingredient_unit_weights enable row level security;
create policy "recipe units readable" on public.recipe_units for select using (is_active = true);
create policy "recipe conversion ingredients readable" on public.recipe_conversion_ingredients for select using (is_active = true);
create policy "ingredient weights readable" on public.ingredient_unit_weights for select using (true);
grant select on public.recipe_units, public.recipe_conversion_ingredients, public.ingredient_unit_weights to anon, authenticated;
