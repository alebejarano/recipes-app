-- Plant milks are separate profiles: they share metric volume presentation
-- with dairy milk but retain their own approximate mass-to-volume references.
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
    'almond milk',
    'dairy alternative',
    'milk',
    array['unsweetened almond milk', 'almond beverage'],
    array['almond milk', 'unsweetened almond milk', 'almond beverage'],
    'ml'
  ),
  (
    'soy milk',
    'dairy alternative',
    'milk',
    array['soya milk', 'unsweetened soy milk', 'soy beverage'],
    array['soy milk', 'soya milk', 'unsweetened soy milk', 'soy beverage'],
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
  'US cup',
  'Typical culinary reference',
  source.reference,
  'medium',
  'Tablespoon and teaspoon values are derived from the US-cup anchor.'
from (
  values
    ('almond milk', 240::numeric, 'Unsweetened almond milk; cup'),
    ('soy milk', 243::numeric, 'Unsweetened soy milk; cup')
) as source(canonical_name, grams_per_cup, reference)
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
where ingredient.canonical_name in ('almond milk', 'soy milk')
  and weight.unit_id = 'cup'
on conflict (ingredient_id, unit_id, preparation) do update
set grams_per_unit = excluded.grams_per_unit,
    source_name = excluded.source_name,
    source_reference = excluded.source_reference,
    confidence = excluded.confidence,
    notes = excluded.notes;
