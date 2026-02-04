// src/features/recipes/hooks/useDeleteRecipe.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { deleteRecipeById } from '../api/recipesRepo'
import { deleteRecipePdfAttachmentsForRecipe } from '../storage/recipePdfStorage'

export function useDeleteRecipe() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteRecipeById(id),
    onSuccess: async (_data, id) => {
      // Remove detail cache
      qc.removeQueries({ queryKey: ['recipes', 'detail', id] })

      // If/when you add a list screen
      qc.invalidateQueries({ queryKey: ['recipes', 'list'] })

      await deleteRecipePdfAttachmentsForRecipe(id)
    },
  })
}
