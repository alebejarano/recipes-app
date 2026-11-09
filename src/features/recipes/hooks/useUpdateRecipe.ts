// src/features/recipes/hooks/useUpdateRecipe.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/features/auth/context/AuthContext'

import type { Recipe, UpdateRecipeInput } from '../api/recipesRepo'
import { updateRecipe } from '../api/recipesRepo'

export function useUpdateRecipe(id: string) {
  const { user } = useAuth()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateRecipeInput) => updateRecipe(id, input),
    onSuccess: (recipe: Recipe) => {
      const ownerScope = user?.id ?? 'guest'

      // Keep this exactly aligned with useRecipe's user-scoped cache key.
      qc.setQueryData(['recipes', 'detail', ownerScope, recipe.id], recipe)

      // Lists use additional parameter segments, so invalidate by their prefix.
      qc.invalidateQueries({ queryKey: ['recipes', 'list'] })
      qc.invalidateQueries({ queryKey: ['recipes', 'detail', ownerScope, recipe.id] })
    },
  })
}
