import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react-native'
import React from 'react'

import { useUpdateRecipeDocumentTitle } from '../useRecipeDocuments'

const mockGetRecipeDocument = jest.fn()
const mockGetRecipeDocumentByCloudId = jest.fn()
const mockUpdateRecipeDocumentTitle = jest.fn()
const mockUpdateCloudRecipeDocumentTitle = jest.fn()

jest.mock('@/features/recipes/api/recipeDocumentsCloudRepo', () => ({
  CLOUD_RECIPE_DOCUMENTS_PAGE_SIZE: 50,
  deleteCloudRecipeDocument: jest.fn(),
  getCloudRecipeDocument: jest.fn(),
  getCloudRecipeDocumentUsageSummary: jest.fn(),
  listCloudRecipeDocumentsPage: jest.fn(),
  updateCloudRecipeDocumentTitle: (...args: unknown[]) => mockUpdateCloudRecipeDocumentTitle(...args),
}))
jest.mock('@/features/recipes/api/freeArchiveRepo', () => ({
  listFreeImportLibraryMetadata: jest.fn(),
}))
jest.mock('@/features/recipes/storage/recipeDocumentStorage', () => ({
  addRecipeDocument: jest.fn(),
  deleteRecipeDocument: jest.fn(),
  getRecipeDocument: (...args: unknown[]) => mockGetRecipeDocument(...args),
  getRecipeDocumentByCloudId: (...args: unknown[]) => mockGetRecipeDocumentByCloudId(...args),
  getRecipeDocumentUsageSummary: jest.fn(),
  listPendingLocalRecipeDocuments: jest.fn(),
  listRecipeDocuments: jest.fn(),
  updateRecipeDocumentTitle: (...args: unknown[]) => mockUpdateRecipeDocumentTitle(...args),
}))
jest.mock('@/features/recipes/sync/recipeSync', () => ({ triggerRecipeSync: jest.fn() }))
jest.mock('@/features/auth/context/AuthContext', () => ({ useAuth: jest.fn() }))
jest.mock('@/features/storage/context/StorageStrategyContext', () => ({ useStorageStrategy: jest.fn() }))
jest.mock('@/features/storage/hooks/useStorageDataMode', () => ({
  useStorageDataMode: () => ({ shouldUseLocalData: false }),
}))

describe('useUpdateRecipeDocumentTitle', () => {
  beforeEach(() => {
    mockGetRecipeDocument.mockReset().mockResolvedValue({ id: 'local-id', cloudId: 'cloud-id' })
    mockGetRecipeDocumentByCloudId.mockReset()
    mockUpdateRecipeDocumentTitle.mockReset().mockResolvedValue(undefined)
    mockUpdateCloudRecipeDocumentTitle.mockReset().mockResolvedValue(undefined)
  })

  it('updates the cloud record and then its local mirror for a synced import', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        mutations: { gcTime: 0 },
        queries: { retry: false },
      },
    })
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    const { result, unmount } = await renderHook(() => useUpdateRecipeDocumentTitle(), { wrapper })
    const detailKey = ['recipes', 'documents', 'cloud', 'user-id', 'cloud-id', 'all']
    queryClient.setQueryData(detailKey, { id: 'local-id', title: 'Old import name' })

    await act(async () => {
      await result.current.mutateAsync({ id: 'cloud-id', title: 'New import name' })
    })

    expect(mockUpdateCloudRecipeDocumentTitle).toHaveBeenCalledWith({
      id: 'cloud-id',
      title: 'New import name',
    })
    expect(mockUpdateRecipeDocumentTitle).toHaveBeenCalledWith({
      id: 'local-id',
      title: 'New import name',
    })
    expect(queryClient.getQueryData(detailKey)).toEqual({
      id: 'local-id',
      title: 'New import name',
    })
    unmount()
    queryClient.clear()
  })
})
