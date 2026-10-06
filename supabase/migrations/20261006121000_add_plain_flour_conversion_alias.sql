-- In imported recipes, an unqualified "flour" means all-purpose flour.
-- This is an explicit product rule, not fuzzy ingredient matching.
update public.recipe_conversion_ingredients
set aliases = array(
  select distinct alias
  from unnest(aliases || array['flour']) as alias
)
where canonical_name = 'all-purpose flour';
