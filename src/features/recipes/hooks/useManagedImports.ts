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
import { triggerRecipeSync } from '@/features/recipes/sync/recipeSync'
import { useStorageDataMode, type StorageScreenMode } from '@/features/storage/hooks/useStorageDataMode'

const IMPORTS_KEY = ['recipes', 'imports', 'managed']
const DOCS_KEY = ['recipes', 'documents']
const DOCS_USAGE_KEY = ['recipes', 'documents', 'usage']

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const value = (error as { message?: unknown }).message
    if (typeof value === 'string') return value
  }
  return ''
}

function isConnectivityError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase()
  return (
    message.includes('network') ||
    message.includes('failed to fetch') ||
    message.includes('timed out') ||
    message.includes('timeout') ||
    message.includes('socket') ||
    message.includes('abort') ||
    message.includes('unknownhost') ||
    message.includes('unable to resolve host') ||
    message.includes('no address associated with hostname')
  )
}

export function useManagedImports(mode: StorageScreenMode = 'auth') {
  const { isStorageModeReady, shouldUseLocalData } = useStorageDataMode(mode)
  const query = useInfiniteQuery<
    CloudRecipeDocumentsPage<ManagedImport>,
    Error,
    InfiniteData<CloudRecipeDocumentsPage<ManagedImport>>,
    string[],
    CloudRecipeDocumentsCursor | null
  >({
    queryKey: [...IMPORTS_KEY, shouldUseLocalData ? 'local' : 'cloud'],
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
        return await listCloudManagedImportsPage({
          cursor: pageParam,
          limit: CLOUD_RECIPE_DOCUMENTS_PAGE_SIZE,
        })
      } catch (error) {
        if (!isConnectivityError(error)) throw error
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
