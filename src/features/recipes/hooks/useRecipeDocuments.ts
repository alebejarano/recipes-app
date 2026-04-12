import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  deleteCloudRecipeDocument,
  getCloudRecipeDocument,
  listCloudRecipeDocuments,
} from '@/features/recipes/api/recipeDocumentsCloudRepo'
import type { ImportPlan } from '@/features/recipes/storage/importsStorage'
import {
  addRecipeDocument,
  deleteRecipeDocument,
  getRecipeDocument,
  getRecipeDocumentUsageSummary,
  listRecipeDocuments,
  type PendingRecipeDocument,
  type RecipeDocument,
} from '@/features/recipes/storage/recipeDocumentStorage'
import { useStorageDataMode, type StorageScreenMode } from '@/features/storage/hooks/useStorageDataMode'

const DOCS_KEY = ['recipes', 'documents']
const USAGE_KEY = ['recipes', 'documents', 'usage']

export function useRecipeDocuments(mode: StorageScreenMode = 'auth') {
  const { shouldUseLocalData } = useStorageDataMode(mode)
  return useQuery<RecipeDocument[]>({
    queryKey: [...DOCS_KEY, shouldUseLocalData ? 'local' : 'cloud'],
    queryFn: shouldUseLocalData ? listRecipeDocuments : listCloudRecipeDocuments,
  })
}

export function useRecipeDocument(id: string, mode: StorageScreenMode = 'auth') {
  const { shouldUseLocalData } = useStorageDataMode(mode)
  return useQuery<RecipeDocument | null>({
    queryKey: [...DOCS_KEY, shouldUseLocalData ? 'local' : 'cloud', id],
    queryFn: () => (shouldUseLocalData ? getRecipeDocument(id) : getCloudRecipeDocument(id)),
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
    mutationFn: (input: { title?: string | null; file: PendingRecipeDocument; plan?: ImportPlan }) =>
      addRecipeDocument({
        title: input.title,
        uri: input.file.uri,
        name: input.file.name,
        size: input.file.size,
        plan: input.plan,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DOCS_KEY })
      qc.invalidateQueries({ queryKey: USAGE_KEY })
    },
  })
}

export function useDeleteRecipeDocument(mode: StorageScreenMode = 'auth') {
  const qc = useQueryClient()
  const { shouldUseLocalData } = useStorageDataMode(mode)
  return useMutation({
    mutationFn: (id: string) =>
      shouldUseLocalData ? deleteRecipeDocument(id) : deleteCloudRecipeDocument(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DOCS_KEY })
      qc.invalidateQueries({ queryKey: USAGE_KEY })
    },
  })
}
