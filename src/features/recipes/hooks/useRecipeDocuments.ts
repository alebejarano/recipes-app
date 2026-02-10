import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  addRecipeDocument,
  deleteRecipeDocument,
  getRecipeDocument,
  getRecipeDocumentUsageSummary,
  listRecipeDocuments,
  type PendingRecipeDocument,
  type RecipeDocument,
} from '@/features/recipes/storage/recipeDocumentStorage'

const DOCS_KEY = ['recipes', 'documents']
const USAGE_KEY = ['recipes', 'documents', 'usage']

export function useRecipeDocuments() {
  return useQuery<RecipeDocument[]>({
    queryKey: DOCS_KEY,
    queryFn: listRecipeDocuments,
  })
}

export function useRecipeDocument(id: string) {
  return useQuery<RecipeDocument | null>({
    queryKey: [...DOCS_KEY, id],
    queryFn: () => getRecipeDocument(id),
    enabled: Boolean(id),
  })
}

export function useRecipeDocumentUsageSummary(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: USAGE_KEY,
    queryFn: getRecipeDocumentUsageSummary,
    enabled: options?.enabled,
  })
}

export function useAddRecipeDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { title?: string | null; file: PendingRecipeDocument }) =>
      addRecipeDocument({
        title: input.title,
        uri: input.file.uri,
        name: input.file.name,
        size: input.file.size,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DOCS_KEY })
      qc.invalidateQueries({ queryKey: USAGE_KEY })
    },
  })
}

export function useDeleteRecipeDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteRecipeDocument(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DOCS_KEY })
      qc.invalidateQueries({ queryKey: USAGE_KEY })
    },
  })
}
