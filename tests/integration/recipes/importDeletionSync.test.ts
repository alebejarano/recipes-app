import AsyncStorage from '@react-native-async-storage/async-storage'

import { deleteImport } from '@/features/recipes/services/deleteImport'
import { syncPendingRecipeDocuments, triggerRecipeSync } from '@/features/recipes/sync/recipeSync'
import { setActiveLocalDataOwner } from '@/features/storage/localDataScope'

type Document = { id: string; cloudId: string | null; title: string; fileName: string; fileUri: string; fileSize: number; createdAt: string }
const mockDocuments = new Map<string, Document>()
const mockDeletedCloudIds = new Set<string>()
const mockUpload = jest.fn()
const mockListPage = jest.fn()
const mockRestore = jest.fn()
const mockGetDownloadUrl = jest.fn()
const mockCloudDelete = jest.fn()
const mockLocalDelete = jest.fn()

jest.mock('@/lib/supabase', () => ({ supabase: { auth: { getSession: async () => ({ data: { session: { user: { id: 'account-a' } } }, error: null }) } } }))
jest.mock('@/lib/productionLogger', () => ({ getErrorCategory: () => 'unknown', logOperationalEvent: jest.fn() }))
jest.mock('@/features/recipes/api/recipesRepo', () => ({
    createRecipe: jest.fn(), deleteRecipeById: jest.fn(), updateRecipe: jest.fn(),
    ensureCloudRecipeImageUrl: jest.fn(), listRecipes: async () => [],
}))
jest.mock('@/features/recipes/storage/localRecipesStorage', () => ({
    listDirtyLocalRecipeRowsForSync: async () => [], listLocalRecipeRowsForImageRepair: async () => [],
    mergeCloudRecipesIntoLocal: jest.fn(), markLocalRecipeSynced: jest.fn(), purgeLocalRecipeRow: jest.fn(),
}))
jest.mock('@/features/recipes/api/importsRepo', () => ({ uploadPremiumImport: (...args: unknown[]) => mockUpload(...args) }))
jest.mock('@/features/recipes/api/recipeDocumentsCloudRepo', () => ({
    CLOUD_RECIPE_DOCUMENTS_PAGE_SIZE: 50,
    listCloudRecipeDocumentsPage: (...args: unknown[]) => mockListPage(...args),
    getActiveImportDownloadUrl: (...args: unknown[]) => mockGetDownloadUrl(...args),
    listDeletedCloudRecipeDocumentIds: async (ids: string[]) => ids.filter((id) => mockDeletedCloudIds.has(id)),
    deleteCloudRecipeDocument: (...args: unknown[]) => mockCloudDelete(...args),
}))
jest.mock('@/features/recipes/storage/importsStorage', () => ({ listManagedImports: async () => [], deleteManagedImport: jest.fn() }))
jest.mock('@/features/recipes/storage/recipeDocumentStorage', () => ({
    getRecipeDocument: async (id: string) => mockDocuments.get(id) ?? null,
    getRecipeDocumentByCloudId: async (id: string) => [...mockDocuments.values()].find((document) => document.cloudId === id) ?? null,
    listRecipeDocuments: async () => [...mockDocuments.values()],
    listDirtyLocalRecipeDocumentRowsForSync: async () => [...mockDocuments.values()]
        .filter((document) => !document.cloudId).map((document) => ({ ...document, ownerUserId: 'account-a' })),
    markLocalRecipeDocumentSynced: async ({ localId, cloudId }: { localId: string; cloudId: string }) => {
        const document = mockDocuments.get(localId)
        if (document) document.cloudId = cloudId
    },
    recordLocalRecipeDocumentSyncFailure: jest.fn(), updateRecipeDocumentTitle: jest.fn(),
    restoreCloudRecipeDocument: (...args: unknown[]) => mockRestore(...args),
    deleteRecipeDocument: (...args: unknown[]) => mockLocalDelete(...args),
}))

const fixture: Document = {
    id: 'local-document', cloudId: 'cloud-document', title: 'Fixture', fileName: 'fixture.pdf',
    fileUri: 'file:///fixture.pdf', fileSize: 100, createdAt: '2026-11-16T12:00:00Z',
}

beforeEach(() => {
    jest.clearAllMocks()
    setActiveLocalDataOwner('account-a')
    jest.mocked(AsyncStorage.getItem).mockResolvedValue('premium')
    mockDocuments.clear(); mockDeletedCloudIds.clear()
    mockDocuments.set(fixture.id, { ...fixture })
    mockListPage.mockResolvedValue({ items: [], nextCursor: null })
    mockCloudDelete.mockImplementation(async (id: string) => { mockDeletedCloudIds.add(id) })
    mockLocalDelete.mockImplementation(async (id: string) => { mockDocuments.delete(id) })
    mockGetDownloadUrl.mockImplementation(async (id: string) => {
        if (mockDeletedCloudIds.has(id)) throw new Error('Import not found')
        return 'https://fixture.invalid/file'
    })
})
afterEach(() => setActiveLocalDataOwner(null))

it('finishes an in-flight upload before deleting its canonical cloud record and local file', async () => {
    mockDocuments.get(fixture.id)!.cloudId = null
    let finishUpload!: (value: unknown) => void
    let uploadStarted!: () => void
    const started = new Promise<void>((resolve) => { uploadStarted = resolve })
    mockUpload.mockImplementation(() => { uploadStarted(); return new Promise((resolve) => { finishUpload = resolve }) })
    const syncing = syncPendingRecipeDocuments('account-a')
    await started
    const deleting = deleteImport({ id: fixture.id, source: 'document', useLocalData: false })
    finishUpload({ document: { id: 'new-cloud-document' } })
    await Promise.all([syncing, deleting])
    expect(mockCloudDelete).toHaveBeenCalledWith('new-cloud-document')
    expect(mockDocuments.size).toBe(0)
    expect((await syncPendingRecipeDocuments('account-a')).pendingCount).toBe(0)
    expect(mockUpload).toHaveBeenCalledTimes(1)
})

it('does not restore a deleted import from a cloud page captured before deletion', async () => {
    let finishPage!: (value: unknown) => void
    let pageRequested!: () => void
    const requested = new Promise<void>((resolve) => { pageRequested = resolve })
    mockListPage.mockImplementationOnce(() => { pageRequested(); return new Promise((resolve) => { finishPage = resolve }) })
    const syncing = triggerRecipeSync()
    await requested
    await deleteImport({ id: fixture.cloudId!, source: 'document', useLocalData: false })
    finishPage({ items: [{ ...fixture, id: fixture.cloudId }], nextCursor: null })
    await syncing
    expect(mockGetDownloadUrl).toHaveBeenCalledWith(fixture.cloudId)
    expect(mockRestore).not.toHaveBeenCalled()
    expect(mockDocuments.size).toBe(0)
})

it('repairs an old offline ghost only when the server explicitly reports its deletion', async () => {
    mockDeletedCloudIds.add(fixture.cloudId!)
    await triggerRecipeSync()
    expect(mockLocalDelete).toHaveBeenCalledWith(fixture.id)
    expect(mockDocuments.size).toBe(0)
})

it('preserves cached imports omitted from a list when there is no explicit deletion marker', async () => {
    await triggerRecipeSync()
    expect(mockLocalDelete).not.toHaveBeenCalled()
    expect(mockDocuments.size).toBe(1)
})
