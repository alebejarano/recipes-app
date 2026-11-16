import { useInfiniteQuery, useQuery, type InfiniteData } from '@tanstack/react-query'

import {
  type ManagedImport,
  listManagedImports,
} from '@/features/recipes/storage/importsStorage'
import {
  CLOUD_RECIPE_DOCUMENTS_PAGE_SIZE,
  listCloudManagedImportsPage,
  type CloudRecipeDocumentsCursor,
  type CloudRecipeDocumentsPage,
} from '@/features/recipes/api/recipeDocumentsCloudRepo'
import { listFreeImportLibraryMetadata } from '@/features/recipes/api/freeArchiveRepo'
import { listPendingLocalRecipeDocuments } from '@/features/recipes/storage/recipeDocumentStorage'
import { useImportDeletion } from '@/features/recipes/hooks/useImportDeletion'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useStorageDataMode, type StorageScreenMode } from '@/features/storage/hooks/useStorageDataMode'
import { useStorageStrategy } from '@/features/storage/context/StorageStrategyContext'

const IMPORTS_KEY = ['recipes', 'imports', 'managed']

export function useManagedImports(mode: StorageScreenMode = 'auth') {
  const { isStorageModeReady, shouldUseLocalData } = useStorageDataMode(mode)
  const { isAuthenticated, isLoaded, isPremium } = useStorageStrategy()
  const { user } = useAuth()
  const shouldRestrictCloudCache = mode === 'auth' && isAuthenticated && isLoaded && !isPremium
  const activeImportsQuery = useQuery({
    queryKey: ['recipes', 'library', 'free-active-imports'],
    queryFn: listFreeImportLibraryMetadata,
    enabled: shouldRestrictCloudCache,
    retry: false,
  })
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
        const localItems = await listManagedImports()
        // Free and public modes are device-local. Do not merge historical
        // cloud records here: Collection's Imports segment also reads the
        // local document store in this mode, and surfacing cloud-only imports
        // on Home made the two screens disagree after a reinstall.
        return { items: localItems, nextCursor: null }
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

  const activeCloudImportIds = new Set(
    (activeImportsQuery.data ?? []).filter((item) => item.isActive).map((item) => item.id)
  )
  const data = (query.data?.pages.flatMap((page) => page.items) ?? []).filter((item) =>
    !shouldRestrictCloudCache || !item.cloudId || activeCloudImportIds.has(item.cloudId)
  )

  return {
    ...query,
    data,
    isLoading: query.isLoading || (shouldRestrictCloudCache && activeImportsQuery.isLoading),
  }
}

export function useDeleteManagedImport(mode: StorageScreenMode = 'auth') {
  return useImportDeletion('managed', mode)
}
