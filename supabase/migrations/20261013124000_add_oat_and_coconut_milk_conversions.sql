-- Oat milk and coconut milk are liquid profiles with their own approximate
-- mass-to-volume anchors. Coconut milk refers to standard canned/full-fat milk.
insert into public.recipe_conversion_ingredients (
  canonical_name,
  category,
  family_id,
  aliases,
  search_terms,
  preferred_metric_unit
)
values
  (
    'oat milk',
    'dairy alternative',
    'milk',
    array['oat beverage', 'unsweetened oat milk'],
    array['oat milk', 'oat beverage', 'unsweetened oat milk'],
    'ml'
  ),
  (
    'coconut milk',
    'dairy alternative',
    'milk',
    array['canned coconut milk', 'full-fat coconut milk'],
    array['coconut milk', 'canned coconut milk', 'full-fat coconut milk'],
    'ml'
  )
on conflict (canonical_name) do update
set category = excluded.category,
    family_id = excluded.family_id,
    aliases = excluded.aliases,
    search_terms = excluded.search_terms,
    preferred_metric_unit = excluded.preferred_metric_unit;

insert into public.ingredient_unit_weights (
  ingredient_id,
  unit_id,
  grams_per_unit,
  preparation,
  source_name,
  source_reference,
  confidence,
  notes
)
select
  ingredient.id,
  'cup',
  source.grams_per_cup,
  source.preparation,
  'Typical culinary reference',
  source.reference,
  'medium',
  'Tablespoon and teaspoon values are derived from the US-cup anchor.'
from (
  values
    ('oat milk', 240::numeric, 'US cup', 'Oat milk; cup'),
    ('coconut milk', 240::numeric, 'US cup, canned/full-fat', 'Coconut milk; cup')
) as source(canonical_name, grams_per_cup, preparation, reference)
join public.recipe_conversion_ingredients ingredient
  on ingredient.canonical_name = source.canonical_name
on conflict (ingredient_id, unit_id, preparation) do update
set grams_per_unit = excluded.grams_per_unit,
    source_name = excluded.source_name,
    source_reference = excluded.source_reference,
    confidence = excluded.confidence,
    notes = excluded.notes;

insert into public.ingredient_unit_weights (
  ingredient_id,
  unit_id,
  grams_per_unit,
  preparation,
  source_name,
  source_reference,
  confidence,
  notes
)
select
  weight.ingredient_id,
  derived.unit_id,
  weight.grams_per_unit / derived.divisor,
  weight.preparation,
  'Derived from cup weight',
  weight.source_reference,
  weight.confidence,
  'Derived mathematically from the ingredient''s US-cup anchor.'
from public.ingredient_unit_weights weight
cross join (values ('tbsp', 16::numeric), ('tsp', 48::numeric)) as derived(unit_id, divisor)
join public.recipe_conversion_ingredients ingredient on ingredient.id = weight.ingredient_id
where ingredient.canonical_name in ('oat milk', 'coconut milk')
  and weight.unit_id = 'cup'
on conflict (ingredient_id, unit_id, preparation) do update
set grams_per_unit = excluded.grams_per_unit,
    source_name = excluded.source_name,
    source_reference = excluded.source_reference,
    confidence = excluded.confidence,
    notes = excluded.notes;
