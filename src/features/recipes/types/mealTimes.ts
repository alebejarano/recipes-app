export const RECIPE_MEAL_TIMES = ['breakfast', 'lunch', 'snack', 'dinner'] as const

export type RecipeMealTime = (typeof RECIPE_MEAL_TIMES)[number]

type RecipeMealTimeSource = {
  title?: string | null
  subtitle?: string | null
  folders?: { name: string }[] | null
}

const MEAL_TIME_KEYWORDS: Record<RecipeMealTime, string[]> = {
  breakfast: [
    'breakfast',
    'pancake',
    'oat',
    'oatmeal',
    'granola',
    'toast',
    'eggs',
    'omelet',
    'omelette',
    'smoothie',
    'yogurt',
    'porridge',
    'overnight oats',
  ],
  lunch: [
    'lunch',
    'salad',
    'sandwich',
    'wrap',
    'soup',
    'quiche',
    'taco',
    'rice bowl',
    'grain bowl',
    'power bowl',
  ],
  snack: [
    'snack',
    'dessert',
    'sweet',
    'cookie',
    'brownie',
    'cake',
    'muffin',
    'bar',
    'bite',
    'energy',
    'dates',
    'butter dates',
    'truffle',
    'treat',
  ],
  dinner: [
    'dinner',
    'pasta',
    'curry',
    'stew',
    'roast',
    'casserole',
    'noodle',
    'lasagna',
    'risotto',
  ],
}

export function normalizeMealTimes(
  mealTimes: readonly string[] | null | undefined
): RecipeMealTime[] {
  if (!mealTimes || mealTimes.length === 0) return []

  const allowed = new Set<string>(RECIPE_MEAL_TIMES)
  const seen = new Set<RecipeMealTime>()

  for (const mealTime of mealTimes) {
    const normalized = mealTime.trim().toLowerCase()
    if (!allowed.has(normalized)) continue
    seen.add(normalized as RecipeMealTime)
  }

  return Array.from(seen)
}

function buildMealTimeHaystack(recipe: RecipeMealTimeSource) {
  return [
    recipe.title ?? '',
    recipe.subtitle ?? '',
    ...(recipe.folders ?? []).map((folder) => folder.name),
  ]
    .join(' ')
    .toLowerCase()
}

function getMealTimeInferenceScore(
  mealTime: RecipeMealTime,
  haystack: string
) {
  if (!haystack.trim()) return 0

  let score = 0
  for (const keyword of MEAL_TIME_KEYWORDS[mealTime]) {
    if (haystack.includes(keyword)) score += 20
  }

  if (mealTime === 'lunch' && haystack.includes('dinner')) score -= 8
  if (mealTime === 'dinner' && haystack.includes('lunch')) score -= 4
  if ((mealTime === 'lunch' || mealTime === 'dinner') && haystack.includes('yogurt')) score -= 16
  if ((mealTime === 'lunch' || mealTime === 'dinner') && haystack.includes('dessert')) score -= 16
  if ((mealTime === 'lunch' || mealTime === 'dinner') && haystack.includes('dates')) score -= 12
  if (mealTime === 'snack' && (haystack.includes('quick') || haystack.includes('bite'))) score += 8

  return score
}

export function inferMealTimes(recipe: RecipeMealTimeSource): RecipeMealTime[] {
  const haystack = buildMealTimeHaystack(recipe)
  if (!haystack.trim()) return []

  const scores = RECIPE_MEAL_TIMES
    .map((mealTime) => ({
      mealTime,
      score: getMealTimeInferenceScore(mealTime, haystack),
    }))
    .filter((entry) => entry.score >= 20)
    .sort((a, b) => b.score - a.score)

  return scores.slice(0, 2).map((entry) => entry.mealTime)
}

export function resolveMealTimes(
  mealTimes: readonly string[] | null | undefined,
  recipe: RecipeMealTimeSource
): RecipeMealTime[] {
  const normalized = normalizeMealTimes(mealTimes)
  if (normalized.length > 0) return normalized
  return inferMealTimes(recipe)
}
