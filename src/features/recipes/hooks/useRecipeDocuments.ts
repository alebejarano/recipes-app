import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query'

import {
  CLOUD_RECIPE_DOCUMENTS_PAGE_SIZE,
  listCloudRecipeDocumentsPage,
  getCloudRecipeDocumentUsageSummary,
  getCloudRecipeDocument,
  updateCloudRecipeDocumentTitle,
  type CloudRecipeDocumentsCursor,
  type CloudRecipeDocumentsPage,
} from '@/features/recipes/api/recipeDocumentsCloudRepo'
import { listFreeImportLibraryMetadata } from '@/features/recipes/api/freeArchiveRepo'
import type { ImportPlan } from '@/features/recipes/storage/importsStorage'
import {
  addRecipeDocument,
  getRecipeDocument,
  getRecipeDocumentByCloudId,
  getRecipeDocumentUsageSummary,
  listPendingLocalRecipeDocuments,
  listRecipeDocuments,
  updateRecipeDocumentTitle,
  type PendingRecipeDocument,
  type RecipeDocument,
} from '@/features/recipes/storage/recipeDocumentStorage'
import { useStorageStrategy } from '@/features/storage/context/StorageStrategyContext'
import { useStorageDataMode, type StorageScreenMode } from '@/features/storage/hooks/useStorageDataMode'
import { triggerRecipeSync } from '@/features/recipes/sync/recipeSync'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useImportDeletion } from '@/features/recipes/hooks/useImportDeletion'

const DOCS_KEY = ['recipes', 'documents']
const USAGE_KEY = ['recipes', 'documents', 'usage']
const MANAGED_IMPORTS_KEY = ['recipes', 'imports', 'managed']

function updateCachedDocumentTitle<T>(
  value: T,
  ids: ReadonlySet<string>,
  title: string
): T {
  if (!value || typeof value !== 'object') return value

  if ('pages' in value && Array.isArray(value.pages)) {
    return {
      ...value,
      pages: value.pages.map((page) => ({
        ...page,
        items: page.items.map((document: RecipeDocument) =>
          ids.has(document.id) ? { ...document, title } : document
        ),
      })),
    } as T
  }

  if ('id' in value && typeof value.id === 'string' && ids.has(value.id)) {
    return { ...value, title } as T
  }

  return value
}

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

        // Cloud results are authoritative. The only local records allowed in
        // a Premium list are this account's unsynced offline uploads.
        if (pageParam) return cloudPage
        const pendingLocal = await listPendingLocalRecipeDocuments()
        const cloudIds = new Set(cloudPage.items.map((item) => item.id))
        return {
          ...cloudPage,
          items: [...pendingLocal.filter((item) => !cloudIds.has(item.id)), ...cloudPage.items],
        }
      } catch {
        // Imports already staged on this device remain usable when the cloud
        // endpoint is temporarily unavailable or being rolled out.
        return {
          items: await listRecipeDocuments(),
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
    // A former Premium member must not see cached archived imports while the
    // Active Library is being resolved. A never-Premium user has no cloud IDs.
    isLoading: query.isLoading || (shouldRestrictCloudCache && activeImportsQuery.isLoading),
  }
}

export function useRecipeDocument(id: string, mode: StorageScreenMode = 'auth') {
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
  const activeCloudImportIds = new Set(
    (activeImportsQuery.data ?? []).filter((item) => item.isActive).map((item) => item.id)
  )
  const documentQuery = useQuery<RecipeDocument | null>({
    queryKey: [...DOCS_KEY, shouldUseLocalData ? 'local' : 'cloud', user?.id ?? 'guest', id, shouldRestrictCloudCache ? 'active-library' : 'all'],
    queryFn: async () => {
      // A server id in a Premium list is not the SQLite primary key. Prefer
      // either local identity so a synced import opens without a connection.
      const localDocument = await getRecipeDocument(id) ?? await getRecipeDocumentByCloudId(id)
      if (shouldUseLocalData) {
        if (shouldRestrictCloudCache && localDocument?.cloudId && !activeCloudImportIds.has(localDocument.cloudId)) {
          return null
        }
        // Free access is device-local. Never fall back to a cloud download for
        // a former Premium member, even when a route still has a cloud ID.
        if (localDocument || !user?.id || shouldRestrictCloudCache) return localDocument

        // A Premium migration can temporarily use the local strategy while a
        // document is queued. Existing cloud documents must still be
        // reachable by their route id; otherwise the detail screen attempts
        // to resolve a cloud UUID from SQLite and reports a false load error.
        try {
          return await getCloudRecipeDocument(id)
        } catch (error) {
          if (!isConnectivityError(error)) throw error
          return null
        }
      }

      if (localDocument) return localDocument

      try {
        const cloudDocument = await getCloudRecipeDocument(id)
        if (cloudDocument) return cloudDocument
        // A locally queued import has no cloud ID yet. It remains available on
        // this device, but never takes precedence over a cloud record.
        return getRecipeDocument(id)
      } catch {
        return getRecipeDocument(id)
      }
    },
    enabled: Boolean(id) && isStorageModeReady && (!shouldRestrictCloudCache || !activeImportsQuery.isLoading),
  })

  // While the storage strategy is being restored, the document query is
  // deliberately disabled. React Query then reports neither loading nor an
  // error, which used to make the detail page briefly show its failure state.
  return {
    ...documentQuery,
    isLoading:
      !isStorageModeReady ||
      (shouldRestrictCloudCache && activeImportsQuery.isLoading) ||
      documentQuery.isLoading,
  }
}

export function useRecipeDocumentUsageSummary(options?: {
  enabled?: boolean
  mode?: StorageScreenMode
}) {
  const strategy = useStorageStrategy()
  const resolvedMode = options?.mode
  const { shouldUseLocalData } = useStorageDataMode(resolvedMode ?? 'auth')
  const useCloudUsage = resolvedMode ? !shouldUseLocalData : strategy.cloudSyncEnabled
  const shouldUseActiveLibraryUsage =
    (resolvedMode ?? 'auth') === 'auth' &&
    strategy.isAuthenticated &&
    strategy.isLoaded &&
    !strategy.isPremium
  const activeImportsQuery = useQuery({
    queryKey: ['recipes', 'library', 'free-active-imports'],
    queryFn: listFreeImportLibraryMetadata,
    enabled: shouldUseActiveLibraryUsage,
    retry: false,
  })

  const usageQuery = useQuery({
    queryKey: [...USAGE_KEY, useCloudUsage ? 'cloud' : 'local'],
    queryFn: async () => {
      if (!useCloudUsage) return getRecipeDocumentUsageSummary()
      try {
        const cloudUsage = await getCloudRecipeDocumentUsageSummary()
        return cloudUsage
      } catch (error) {
        if (!isConnectivityError(error)) throw error
        return getRecipeDocumentUsageSummary()
      }
    },
    enabled: options?.enabled,
  })

  const activeImports = activeImportsQuery.data?.filter((item) => item.isActive)
  const activeLibraryUsage = activeImports
    ? {
        totalCount: activeImports.length,
        totalBytes: activeImports.reduce((total, item) => total + item.bytes, 0),
      }
    : undefined

  return {
    ...usageQuery,
    data: activeLibraryUsage ?? usageQuery.data,
    isLoading: usageQuery.isLoading || (shouldUseActiveLibraryUsage && activeImportsQuery.isLoading),
  }
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
  return useImportDeletion('document', mode)
}

export function useUpdateRecipeDocumentTitle(mode: StorageScreenMode = 'auth') {
  const qc = useQueryClient()
  const { shouldUseLocalData } = useStorageDataMode(mode)

  return useMutation({
    mutationFn: async (input: { id: string; title: string }) => {
      const localDocument =
        await getRecipeDocument(input.id) ??
        await getRecipeDocumentByCloudId(input.id)

      // A Premium import has a local mirror for offline viewing, but its
      // canonical title is the cloud record used by Collections. Updating
      // only the mirror made the detail screen show the new title while the
      // list kept the old cloud title.
      if (shouldUseLocalData || (localDocument && !localDocument.cloudId)) {
        if (localDocument && localDocument.id !== input.id) {
          await updateRecipeDocumentTitle({ ...input, id: localDocument.id })
          return { localId: localDocument.id, cloudId: localDocument.cloudId }
        }
        await updateRecipeDocumentTitle(input)
        return { localId: input.id, cloudId: localDocument?.cloudId ?? null }
      }

      await updateCloudRecipeDocumentTitle({
        ...input,
        id: localDocument?.cloudId ?? input.id,
      })

      if (!localDocument) return { localId: null, cloudId: input.id }

      // Keep the on-device mirror consistent for offline detail views. The
      // cloud update above has already succeeded, so a cache-write failure
      // must not incorrectly report that the rename failed.
      try {
        await updateRecipeDocumentTitle({ ...input, id: localDocument.id })
      } catch {
        // The next document sync will refresh a stale local mirror.
      }

      return { localId: localDocument.id, cloudId: localDocument.cloudId }
    },
    onSuccess: (result, input) => {
      const ids = new Set([input.id, result.localId, result.cloudId].filter((id): id is string => Boolean(id)))
      qc.setQueriesData({ queryKey: DOCS_KEY }, (current) =>
        updateCachedDocumentTitle(current, ids, input.title.trim())
      )
      qc.invalidateQueries({ queryKey: DOCS_KEY })
      qc.invalidateQueries({ queryKey: MANAGED_IMPORTS_KEY })
      qc.invalidateQueries({ queryKey: [...DOCS_KEY, shouldUseLocalData ? 'local' : 'cloud', input.id] })
    },
  })
}
