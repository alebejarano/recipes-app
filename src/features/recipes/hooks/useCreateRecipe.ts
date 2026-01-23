// src/features/recipes/hooks/useCreateRecipe.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { CreateRecipeInput, Recipe } from '../api/recipesRepo'
import { createRecipe } from '../api/recipesRepo'

export function useCreateRecipe() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateRecipeInput) => createRecipe(input),
    onSuccess: (recipe: Recipe) => {
      // If/when you add a list screen
      qc.invalidateQueries({ queryKey: ['recipes', 'list'] })

      // Let the detail screen fetch fresh data (incl. ingredients)
      qc.invalidateQueries({ queryKey: ['recipes', 'detail', recipe.id] })
    },
  })
}
