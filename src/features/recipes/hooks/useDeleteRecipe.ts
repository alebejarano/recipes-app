// src/features/recipes/hooks/useDeleteRecipe.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { deleteRecipeById } from '../api/recipesRepo'

export function useDeleteRecipe() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteRecipeById(id),
    onSuccess: (_data, id) => {
      // Remove detail cache
      qc.removeQueries({ queryKey: ['recipes', 'detail', id] })

      // If/when you add a list screen
      qc.invalidateQueries({ queryKey: ['recipes', 'list'] })
    },
  })
}
