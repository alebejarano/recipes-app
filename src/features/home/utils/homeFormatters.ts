import { inferMealTimes } from '@/features/recipes/types/mealTimes'
import { i18n } from '@/localization/i18n';
export type MealTime = 'breakfast' | 'lunch' | 'snack' | 'dinner';

type HomePickRecipe = {
  title: string;
  subtitle?: string | null;
  folders?: { name: string }[];
  mealTimes?: string[];
  updatedAt?: string;
  createdAt: string;
};

type RecommendedPick<TRecipe> = {
  label: string;
  recipe: TRecipe;
};

const EXPLICIT_MATCH_SCORE = 100;
const GENERIC_LABEL_KEY = 'home.meals.recommended';

export function getMealTime(now: Date): MealTime {
  const h = now.getHours();
  if (h >= 5 && h < 11) return 'breakfast';
  if (h >= 11 && h < 15) return 'lunch';
  if (h >= 15 && h < 19) return 'snack';
  return 'dinner';
}

export function getPickLabel(meal: MealTime) {
  switch (meal) {
    case 'breakfast':
      return i18n.t('home.meals.breakfast');
    case 'lunch':
      return i18n.t('home.meals.lunch');
    case 'snack':
      return i18n.t('home.meals.snack');
    case 'dinner':
      return i18n.t('home.meals.dinner');
  }
}

function getMealInferenceScore(recipe: HomePickRecipe, meal: MealTime) {
  const normalizedMealTimes = recipe.mealTimes ?? [];
  if (normalizedMealTimes.includes(meal)) return EXPLICIT_MATCH_SCORE;
  const inferredMealTimes = inferMealTimes(recipe);
  return inferredMealTimes.includes(meal) ? 20 : 0;
}

export function getRecommendedPick<TRecipe extends HomePickRecipe>(
  recipes: TRecipe[],
  now: Date
): RecommendedPick<TRecipe> | null {
  if (recipes.length === 0) return null;

  const meal = getMealTime(now);
  const ranked = [...recipes]
    .map((recipe) => ({
      recipe,
      score: getMealInferenceScore(recipe, meal),
      updatedAt: new Date(recipe.updatedAt ?? recipe.createdAt ?? 0).getTime(),
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.updatedAt - a.updatedAt;
    });

  const best = ranked[0];
  if (!best) return null;

  return {
    label: best.score >= 20 ? getPickLabel(meal) : i18n.t(GENERIC_LABEL_KEY),
    recipe: best.recipe,
  };
}

export function formatRelativeDay(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((+now - +d) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return i18n.t('home.relative.today');
  if (diffDays === 1) return i18n.t('home.relative.yesterday');
  return i18n.t('home.relative.daysAgo', { count: diffDays });
}

export function sortMostRecent<T extends { updatedAt?: string; createdAt?: string }>(
  items: T[]
) {
  return [...items].sort((a, b) => {
    const at = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
    const bt = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
    return bt - at;
  });
}
