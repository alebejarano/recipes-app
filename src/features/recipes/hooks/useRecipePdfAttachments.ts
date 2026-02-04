import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  addRecipePdfAttachment,
  deleteRecipePdfAttachment,
  getPdfUsageSummary,
  listRecipePdfAttachments,
  type PendingPdfAttachment,
  type RecipePdfAttachment,
} from '@/features/recipes/storage/recipePdfStorage'

const USAGE_KEY = ['recipes', 'pdfs', 'usage']

export function usePdfUsageSummary() {
  return useQuery({
    queryKey: USAGE_KEY,
    queryFn: getPdfUsageSummary,
  })
}

export function useRecipePdfAttachments(recipeId: string) {
  return useQuery<RecipePdfAttachment[]>({
    queryKey: ['recipes', 'pdfs', recipeId],
    queryFn: () => listRecipePdfAttachments(recipeId),
    enabled: Boolean(recipeId),
  })
}

export function useAddRecipePdfAttachment(recipeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: PendingPdfAttachment) =>
      addRecipePdfAttachment({
        recipeId,
        uri: file.uri,
        name: file.name,
        size: file.size,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recipes', 'pdfs', recipeId] })
      qc.invalidateQueries({ queryKey: USAGE_KEY })
    },
  })
}

export function useDeleteRecipePdfAttachment(recipeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteRecipePdfAttachment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recipes', 'pdfs', recipeId] })
      qc.invalidateQueries({ queryKey: USAGE_KEY })
    },
  })
}
