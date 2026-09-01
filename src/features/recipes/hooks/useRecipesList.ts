// src/features/recipes/hooks/useRecipesList.ts
import { useQuery } from '@tanstack/react-query'

import { useAuth } from '@/features/auth/context/AuthContext'
import type { Recipe } from '../api/recipesRepo'
import { listRecipes } from '../api/recipesRepo'

type RecipesListParams = {
  limit?: number
  search?: string
  enabled?: boolean
}

export function useRecipesList(params?: RecipesListParams) {
  const { user } = useAuth()
  return useQuery<Recipe[]>({
    queryKey: ['recipes', 'list', user?.id ?? 'guest', params?.limit ?? 50, params?.search ?? ''],
    queryFn: () => listRecipes(params),
    enabled: params?.enabled ?? true,
  })
}
