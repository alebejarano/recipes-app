// src/features/recipes/hooks/useRecipe.ts
import { useQuery } from '@tanstack/react-query'

import type { Recipe } from '../api/recipesRepo'
import { getRecipeById } from '../api/recipesRepo'

type UseRecipeParams = {
  enabled?: boolean
}

export function useRecipe(id: string, params?: UseRecipeParams) {
  return useQuery<Recipe>({
    queryKey: ['recipes', 'detail', id],
    queryFn: () => getRecipeById(id),
    enabled: Boolean(id) && (params?.enabled ?? true),
  })
}
