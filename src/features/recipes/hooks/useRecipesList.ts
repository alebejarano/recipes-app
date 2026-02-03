// src/features/recipes/hooks/useRecipesList.ts
import { useQuery } from '@tanstack/react-query'

import type { Recipe } from '../api/recipesRepo'
import { listRecipes } from '../api/recipesRepo'

type RecipesListParams = {
  limit?: number
  search?: string
  enabled?: boolean
}

export function useRecipesList(params?: RecipesListParams) {
  return useQuery<Recipe[]>({
    queryKey: ['recipes', 'list', params?.limit ?? 50, params?.search ?? ''],
    queryFn: () => listRecipes(params),
    enabled: params?.enabled ?? true,
  })
}
