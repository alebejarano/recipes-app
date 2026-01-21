// src/features/recipes/hooks/useUpdateRecipe.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { Recipe, UpdateRecipeInput } from '../api/recipesRepo'
import { updateRecipe } from '../api/recipesRepo'

export function useUpdateRecipe(id: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateRecipeInput) => updateRecipe(id, input),
    onSuccess: (recipe: Recipe) => {
      // Update detail cache immediately
      qc.setQueryData(['recipes', 'detail', recipe.id], recipe)

      // If/when you add a list screen
      qc.invalidateQueries({ queryKey: ['recipes', 'list'] })
    },
  })
}
