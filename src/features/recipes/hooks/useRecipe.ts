// src/features/recipes/hooks/useRecipe.ts
import { useQuery } from '@tanstack/react-query'

import type { Recipe } from '../api/recipesRepo'
import { getRecipeById } from '../api/recipesRepo'

export function useRecipe(id: string) {
  return useQuery<Recipe>({
    queryKey: ['recipes', 'detail', id],
    queryFn: () => getRecipeById(id),
    enabled: Boolean(id),
  })
}
