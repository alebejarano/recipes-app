-- Recipe display preferences make the chosen unit match common recipe conventions.
alter table public.recipe_conversion_ingredients
  add column if not exists preferred_metric_unit text check (preferred_metric_unit in ('g', 'ml'));

-- Liquids retain their volume when shown in metric recipes, even if a density is
-- available for reverse conversions. Oats need an explicit cup-weight reference
-- so they display as grams rather than falling back to millilitres.
update public.recipe_conversion_ingredients
set preferred_metric_unit = 'ml'
where canonical_name in ('milk, whole', 'water', 'olive oil');

insert into public.recipe_conversion_ingredients (canonical_name, category, aliases, search_terms, preferred_metric_unit)
values (
  'rolled oats',
  'grain',
  array['oats', 'old-fashioned oats', 'porridge oats'],
  array['rolled oats', 'oats', 'old-fashioned oats', 'porridge oats'],
  'g'
)
on conflict (canonical_name) do update
set category = excluded.category,
    aliases = excluded.aliases,
    search_terms = excluded.search_terms,
    preferred_metric_unit = excluded.preferred_metric_unit;

insert into public.ingredient_unit_weights (ingredient_id, unit_id, grams_per_unit, preparation, source_name, source_reference, confidence, notes)
select ingredient.id, 'cup', 80::numeric, 'US dry cup', 'USDA FoodData Central', 'Rolled oats; cup', 'high', 'Tablespoon and teaspoon values are derived from the US-cup anchor.'
from public.recipe_conversion_ingredients ingredient
where ingredient.canonical_name = 'rolled oats'
on conflict (ingredient_id, unit_id, preparation) do update
set grams_per_unit = excluded.grams_per_unit,
    source_name = excluded.source_name,
    source_reference = excluded.source_reference,
    confidence = excluded.confidence,
    notes = excluded.notes;

insert into public.ingredient_unit_weights (ingredient_id, unit_id, grams_per_unit, preparation, source_name, source_reference, confidence, notes)
select weight.ingredient_id, derived.unit_id, weight.grams_per_unit / derived.divisor, weight.preparation, 'Derived from cup weight', weight.source_reference, weight.confidence, 'Derived mathematically from the ingredient''s US-cup anchor.'
from public.ingredient_unit_weights weight
cross join (values ('tbsp', 16::numeric), ('tsp', 48::numeric)) as derived(unit_id, divisor)
join public.recipe_conversion_ingredients ingredient on ingredient.id = weight.ingredient_id
where ingredient.canonical_name = 'rolled oats' and weight.unit_id = 'cup'
on conflict (ingredient_id, unit_id, preparation) do update
set grams_per_unit = excluded.grams_per_unit,
    source_name = excluded.source_name,
    source_reference = excluded.source_reference,
    confidence = excluded.confidence,
    notes = excluded.notes;
