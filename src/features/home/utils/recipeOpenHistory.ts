import AsyncStorage from '@react-native-async-storage/async-storage';

export const RECIPE_OPEN_HISTORY_KEY = 'home_recipe_open_history_v1';

export type RecipeOpenHistoryEntry = {
  count: number;
  lastOpenedAt: number;
};

export type RecipeOpenHistory = Record<string, RecipeOpenHistoryEntry>;

function parseRecipeOpenHistory(raw: string | null): RecipeOpenHistory {
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};

    return Object.fromEntries(
      Object.entries(parsed).flatMap(([recipeId, value]) => {
        if (!value || typeof value !== 'object') return [];
        const count = Number((value as RecipeOpenHistoryEntry).count);
        const lastOpenedAt = Number((value as RecipeOpenHistoryEntry).lastOpenedAt);
        if (!Number.isFinite(count) || !Number.isFinite(lastOpenedAt) || count <= 0) return [];
        return [[recipeId, { count, lastOpenedAt } satisfies RecipeOpenHistoryEntry]];
      })
    );
  } catch {
    return {};
  }
}

export async function loadRecipeOpenHistory() {
  const raw = await AsyncStorage.getItem(RECIPE_OPEN_HISTORY_KEY);
  return parseRecipeOpenHistory(raw);
}

export async function recordRecipeOpen(recipeId: string) {
  const history = await loadRecipeOpenHistory();
  const previous = history[recipeId];

  history[recipeId] = {
    count: (previous?.count ?? 0) + 1,
    lastOpenedAt: Date.now(),
  };

  const prunedEntries = Object.entries(history)
    .sort((a, b) => {
      if (b[1].count !== a[1].count) return b[1].count - a[1].count;
      return b[1].lastOpenedAt - a[1].lastOpenedAt;
    })
    .slice(0, 100);

  await AsyncStorage.setItem(RECIPE_OPEN_HISTORY_KEY, JSON.stringify(Object.fromEntries(prunedEntries)));
}
