-- Oat flour has a different cup weight from rolled oats, so it needs its own
-- conversion profile and must resolve before the generic flour family.
insert into public.recipe_conversion_ingredients (canonical_name, category, aliases, search_terms, preferred_metric_unit)
values (
  'oat flour',
  'flour',
  array[]::text[],
  array['oat flour'],
  'g'
)
on conflict (canonical_name) do update
set category = excluded.category,
    aliases = excluded.aliases,
    search_terms = excluded.search_terms,
    preferred_metric_unit = excluded.preferred_metric_unit;

insert into public.ingredient_unit_weights (ingredient_id, unit_id, grams_per_unit, preparation, source_name, source_reference, confidence, notes)
select ingredient.id, 'cup', 90::numeric, 'US level cup', 'Typical culinary reference', 'Oat flour; cup', 'medium', 'Tablespoon and teaspoon values are derived from the US-cup anchor.'
from public.recipe_conversion_ingredients ingredient
where ingredient.canonical_name = 'oat flour'
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
where ingredient.canonical_name = 'oat flour' and weight.unit_id = 'cup'
on conflict (ingredient_id, unit_id, preparation) do update
set grams_per_unit = excluded.grams_per_unit,
    source_name = excluded.source_name,
    source_reference = excluded.source_reference,
    confidence = excluded.confidence,
    notes = excluded.notes;
