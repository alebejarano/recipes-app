import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query'

import {
  deleteManagedImport,
  type ManagedImport,
  listManagedImports,
} from '@/features/recipes/storage/importsStorage'
import {
  CLOUD_RECIPE_DOCUMENTS_PAGE_SIZE,
  deleteCloudRecipeDocument,
  listCloudManagedImportsPage,
  type CloudRecipeDocumentsCursor,
  type CloudRecipeDocumentsPage,
} from '@/features/recipes/api/recipeDocumentsCloudRepo'
import { listPendingLocalRecipeDocuments } from '@/features/recipes/storage/recipeDocumentStorage'
import { triggerRecipeSync } from '@/features/recipes/sync/recipeSync'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useStorageDataMode, type StorageScreenMode } from '@/features/storage/hooks/useStorageDataMode'

const IMPORTS_KEY = ['recipes', 'imports', 'managed']
const DOCS_KEY = ['recipes', 'documents']
const DOCS_USAGE_KEY = ['recipes', 'documents', 'usage']

export function useManagedImports(mode: StorageScreenMode = 'auth') {
  const { isStorageModeReady, shouldUseLocalData } = useStorageDataMode(mode)
  const { user } = useAuth()
  const query = useInfiniteQuery<
    CloudRecipeDocumentsPage<ManagedImport>,
    Error,
    InfiniteData<CloudRecipeDocumentsPage<ManagedImport>>,
    string[],
    CloudRecipeDocumentsCursor | null
  >({
    queryKey: [...IMPORTS_KEY, shouldUseLocalData ? 'local' : 'cloud', user?.id ?? 'guest'],
    initialPageParam: null,
    enabled: isStorageModeReady,
    queryFn: async ({ pageParam }) => {
      if (shouldUseLocalData) {
        return {
          items: await listManagedImports(),
          nextCursor: null,
        }
      }

      try {
        const cloudPage = await listCloudManagedImportsPage({
          cursor: pageParam,
          limit: CLOUD_RECIPE_DOCUMENTS_PAGE_SIZE,
        })

        // Only include this account's unsynced document uploads from the
        // device. All synced items must come from the cloud response.
        if (pageParam) return cloudPage
        const pendingDocumentIds = new Set(
          (await listPendingLocalRecipeDocuments()).map((document) => document.id)
        )
        if (pendingDocumentIds.size === 0) return cloudPage
        const localPending = (await listManagedImports()).filter(
          (item) => item.documentId && pendingDocumentIds.has(item.documentId)
        )
        const cloudIds = new Set(cloudPage.items.map((item) => item.id))
        return {
          ...cloudPage,
          items: [...localPending.filter((item) => !cloudIds.has(item.id)), ...cloudPage.items],
        }
      } catch {
        // Keep the local registry usable if a cloud list request cannot be
        // completed. Pending uploads will retry through RecipeSyncBootstrap.
        return {
          items: await listManagedImports(),
          nextCursor: null,
        }
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })

  return {
    ...query,
    data: query.data?.pages.flatMap((page) => page.items) ?? [],
  }
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
