// src/features/recipes/hooks/useCreateRecipe.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useAnalyticsCapture } from '@/features/analytics/events'
import type { CreateRecipeInput, Recipe } from '../api/recipesRepo'
import { createRecipe } from '../api/recipesRepo'

export function useCreateRecipe() {
  const qc = useQueryClient()
  const captureAnalyticsEvent = useAnalyticsCapture()

  return useMutation({
    mutationFn: (input: CreateRecipeInput) => createRecipe(input),
    onSuccess: (recipe: Recipe) => {
      captureAnalyticsEvent('recipe_created', {
        source: 'manual',
        storage_mode: 'cloud',
      })

      // If/when you add a list screen
      qc.invalidateQueries({ queryKey: ['recipes', 'list'] })

      // Let the detail screen fetch fresh data (incl. ingredients)
      qc.invalidateQueries({ queryKey: ['recipes', 'detail', recipe.id] })
    },
  })
}
