// src/features/recipes/hooks/useRecipe.ts
import { useQuery } from '@tanstack/react-query'

import { useAuth } from '@/features/auth/context/AuthContext'
import type { Recipe } from '../api/recipesRepo'
import { getRecipeById } from '../api/recipesRepo'

type UseRecipeParams = {
  enabled?: boolean
}

export function useRecipe(id: string, params?: UseRecipeParams) {
  const { user } = useAuth()
  return useQuery<Recipe>({
    queryKey: ['recipes', 'detail', user?.id ?? 'guest', id],
    queryFn: () => getRecipeById(id),
    enabled: Boolean(id) && (params?.enabled ?? true),
  })
}
