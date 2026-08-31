import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query'

import {
  CLOUD_RECIPE_DOCUMENTS_PAGE_SIZE,
  listCloudRecipeDocumentsPage,
  deleteCloudRecipeDocument,
  getCloudRecipeDocumentUsageSummary,
  getCloudRecipeDocument,
  updateCloudRecipeDocumentTitle,
  type CloudRecipeDocumentsCursor,
  type CloudRecipeDocumentsPage,
} from '@/features/recipes/api/recipeDocumentsCloudRepo'
import type { ImportPlan } from '@/features/recipes/storage/importsStorage'
import {
  addRecipeDocument,
  deleteRecipeDocument,
  getRecipeDocument,
  getRecipeDocumentUsageSummary,
  listRecipeDocuments,
  updateRecipeDocumentTitle,
  type PendingRecipeDocument,
  type RecipeDocument,
} from '@/features/recipes/storage/recipeDocumentStorage'
import { useStorageStrategy } from '@/features/storage/context/StorageStrategyContext'
import { useStorageDataMode, type StorageScreenMode } from '@/features/storage/hooks/useStorageDataMode'
import { triggerRecipeSync } from '@/features/recipes/sync/recipeSync'
import { useAuth } from '@/features/auth/context/AuthContext'

const DOCS_KEY = ['recipes', 'documents']
const USAGE_KEY = ['recipes', 'documents', 'usage']
const MANAGED_IMPORTS_KEY = ['recipes', 'imports', 'managed']

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

export function useRecipeDocuments(mode: StorageScreenMode = 'auth') {
  const { isStorageModeReady, shouldUseLocalData } = useStorageDataMode(mode)
  const { user } = useAuth()
  const query = useInfiniteQuery<
    CloudRecipeDocumentsPage<RecipeDocument>,
    Error,
    InfiniteData<CloudRecipeDocumentsPage<RecipeDocument>>,
    string[],
    CloudRecipeDocumentsCursor | null
  >({
    queryKey: [...DOCS_KEY, shouldUseLocalData ? 'local' : 'cloud', user?.id ?? 'guest'],
    initialPageParam: null,
    enabled: isStorageModeReady,
    queryFn: async ({ pageParam }) => {
      if (shouldUseLocalData) {
        return {
          items: await listRecipeDocuments(),
          nextCursor: null,
        }
      }

      try {
        const cloudPage = await listCloudRecipeDocumentsPage({
          cursor: pageParam,
          limit: CLOUD_RECIPE_DOCUMENTS_PAGE_SIZE,
        })

        // Retain access to device-local imports while their initial Premium
        // upload is still pending or being retried.
        if (pageParam || cloudPage.items.length > 0) return cloudPage

        return {
          items: await listRecipeDocuments(),
          nextCursor: null,
        }
      } catch (error) {
        if (!isConnectivityError(error)) throw error
        return {
          items: await listRecipeDocuments(),
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

export function useRecipeDocument(id: string, mode: StorageScreenMode = 'auth') {
  const { isStorageModeReady, shouldUseLocalData } = useStorageDataMode(mode)
  const { user } = useAuth()
  return useQuery<RecipeDocument | null>({
    queryKey: [...DOCS_KEY, shouldUseLocalData ? 'local' : 'cloud', user?.id ?? 'guest', id],
    queryFn: async () => {
      if (shouldUseLocalData) return getRecipeDocument(id)

      // Cloud and local documents use different IDs. When the list falls back
      // to locally retained imports, resolve that record before asking the
      // cloud API for the same ID.
      const localDocument = await getRecipeDocument(id)
      if (localDocument) return localDocument

      try {
        return await getCloudRecipeDocument(id)
      } catch (error) {
        if (!isConnectivityError(error)) throw error
        return getRecipeDocument(id)
      }
    },
    enabled: Boolean(id) && isStorageModeReady,
  })
}

export function useRecipeDocumentUsageSummary(options?: {
  enabled?: boolean
  mode?: StorageScreenMode
}) {
  const strategy = useStorageStrategy()
  const resolvedMode = options?.mode
  const { shouldUseLocalData } = useStorageDataMode(resolvedMode ?? 'auth')
  const useCloudUsage = resolvedMode ? !shouldUseLocalData : strategy.cloudSyncEnabled

  return useQuery({
    queryKey: [...USAGE_KEY, useCloudUsage ? 'cloud' : 'local'],
    queryFn: async () => {
      if (!useCloudUsage) return getRecipeDocumentUsageSummary()
      try {
        const cloudUsage = await getCloudRecipeDocumentUsageSummary()
        if (cloudUsage.totalCount > 0) return cloudUsage

        const localUsage = await getRecipeDocumentUsageSummary()
        return localUsage.totalCount > 0 ? localUsage : cloudUsage
      } catch (error) {
        if (!isConnectivityError(error)) throw error
        return getRecipeDocumentUsageSummary()
      }
    },
    enabled: options?.enabled,
  })
}

export function useAddRecipeDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      title?: string | null
      file: PendingRecipeDocument
      plan?: ImportPlan
      ownerUserId?: string | null
    }) =>
      addRecipeDocument({
        title: input.title,
        uri: input.file.uri,
        name: input.file.name,
        size: input.file.size,
        plan: input.plan,
        ownerUserId: input.ownerUserId ?? null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DOCS_KEY })
      qc.invalidateQueries({ queryKey: USAGE_KEY })
      // Home's Recently added section reads managed imports rather than recipe
      // documents, so refresh that cache after saving a local document too.
      qc.invalidateQueries({ queryKey: MANAGED_IMPORTS_KEY })
      void triggerRecipeSync()
    },
  })
}

export function useDeleteRecipeDocument(mode: StorageScreenMode = 'auth') {
  const qc = useQueryClient()
  const { shouldUseLocalData } = useStorageDataMode(mode)
  return useMutation({
    mutationFn: async (id: string) => {
      if (shouldUseLocalData || await getRecipeDocument(id)) {
        return deleteRecipeDocument(id)
      }
      return deleteCloudRecipeDocument(id)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DOCS_KEY })
      qc.invalidateQueries({ queryKey: USAGE_KEY })
    },
  })
}

export function useUpdateRecipeDocumentTitle(mode: StorageScreenMode = 'auth') {
  const qc = useQueryClient()
  const { shouldUseLocalData } = useStorageDataMode(mode)

  return useMutation({
    mutationFn: async (input: { id: string; title: string }) => {
      if (shouldUseLocalData || await getRecipeDocument(input.id)) {
        return updateRecipeDocumentTitle(input)
      }
      return updateCloudRecipeDocumentTitle(input)
    },
    onSuccess: (_, input) => {
      qc.invalidateQueries({ queryKey: DOCS_KEY })
      qc.invalidateQueries({ queryKey: MANAGED_IMPORTS_KEY })
      qc.invalidateQueries({ queryKey: [...DOCS_KEY, shouldUseLocalData ? 'local' : 'cloud', input.id] })
    },
  })
}
