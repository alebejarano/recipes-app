import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query'

import {
  CLOUD_RECIPE_DOCUMENTS_PAGE_SIZE,
  listCloudRecipeDocumentsPage,
  deleteCloudRecipeDocument,
  getCloudRecipeDocumentUsageSummary,
  getCloudRecipeDocument,
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
  type PendingRecipeDocument,
  type RecipeDocument,
} from '@/features/recipes/storage/recipeDocumentStorage'
import { useStorageStrategy } from '@/features/storage/context/StorageStrategyContext'
import { useStorageDataMode, type StorageScreenMode } from '@/features/storage/hooks/useStorageDataMode'

const DOCS_KEY = ['recipes', 'documents']
const USAGE_KEY = ['recipes', 'documents', 'usage']

export function useRecipeDocuments(mode: StorageScreenMode = 'auth') {
  const { isStorageModeReady, shouldUseLocalData } = useStorageDataMode(mode)
  const query = useInfiniteQuery<
    CloudRecipeDocumentsPage<RecipeDocument>,
    Error,
    InfiniteData<CloudRecipeDocumentsPage<RecipeDocument>>,
    string[],
    CloudRecipeDocumentsCursor | null
  >({
    queryKey: [...DOCS_KEY, shouldUseLocalData ? 'local' : 'cloud'],
    initialPageParam: null,
    enabled: isStorageModeReady,
    queryFn: async ({ pageParam }) => {
      if (shouldUseLocalData) {
        return {
          items: await listRecipeDocuments(),
          nextCursor: null,
        }
      }

      return listCloudRecipeDocumentsPage({
        cursor: pageParam,
        limit: CLOUD_RECIPE_DOCUMENTS_PAGE_SIZE,
      })
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
  return useQuery<RecipeDocument | null>({
    queryKey: [...DOCS_KEY, shouldUseLocalData ? 'local' : 'cloud', id],
    queryFn: () => (shouldUseLocalData ? getRecipeDocument(id) : getCloudRecipeDocument(id)),
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
    queryFn: useCloudUsage ? getCloudRecipeDocumentUsageSummary : getRecipeDocumentUsageSummary,
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
