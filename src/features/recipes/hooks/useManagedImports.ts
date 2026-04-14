import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  deleteManagedImport,
  listManagedImports,
  type ManagedImport,
} from '@/features/recipes/storage/importsStorage'
import {
  deleteCloudRecipeDocument,
  listCloudManagedImports,
} from '@/features/recipes/api/recipeDocumentsCloudRepo'
import { triggerRecipeSync } from '@/features/recipes/sync/recipeSync'
import { useStorageDataMode, type StorageScreenMode } from '@/features/storage/hooks/useStorageDataMode'

const IMPORTS_KEY = ['recipes', 'imports', 'managed']
const DOCS_KEY = ['recipes', 'documents']
const DOCS_USAGE_KEY = ['recipes', 'documents', 'usage']

export function useManagedImports(mode: StorageScreenMode = 'auth') {
  const { shouldUseLocalData } = useStorageDataMode(mode)
  return useQuery<ManagedImport[]>({
    queryKey: [...IMPORTS_KEY, shouldUseLocalData ? 'local' : 'cloud'],
    queryFn: shouldUseLocalData ? listManagedImports : listCloudManagedImports,
  })
}

export function useDeleteManagedImport(mode: StorageScreenMode = 'auth') {
  const qc = useQueryClient()
  const { shouldUseLocalData } = useStorageDataMode(mode)
  return useMutation({
    mutationFn: (importId: string) =>
      shouldUseLocalData ? deleteManagedImport(importId) : deleteCloudRecipeDocument(importId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: IMPORTS_KEY })
      qc.invalidateQueries({ queryKey: DOCS_KEY })
      qc.invalidateQueries({ queryKey: DOCS_USAGE_KEY })
      qc.invalidateQueries({ queryKey: ['recipes'] })
      if (shouldUseLocalData) {
        void triggerRecipeSync()
      }
    },
  })
}
