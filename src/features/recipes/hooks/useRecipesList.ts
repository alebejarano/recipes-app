// src/features/recipes/hooks/useRecipesList.ts
import { useQuery } from '@tanstack/react-query'

import type { Recipe } from '../api/recipesRepo'
import { listRecipes } from '../api/recipesRepo'

export function useRecipesList(params?: { limit?: number; search?: string }) {
  return useQuery<Recipe[]>({
    queryKey: ['recipes', 'list', params?.limit ?? 50, params?.search ?? ''],
    queryFn: () => listRecipes(params),
  })
}
