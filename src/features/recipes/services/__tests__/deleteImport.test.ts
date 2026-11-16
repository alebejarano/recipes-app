import { deleteImport } from '../deleteImport'
import { runRecipeDocumentOperation } from '../recipeDocumentOperations'
import { deleteCloudRecipeDocument } from '@/features/recipes/api/recipeDocumentsCloudRepo'
import { deleteManagedImport, listManagedImports } from '@/features/recipes/storage/importsStorage'
import {
    deleteRecipeDocument,
    getRecipeDocument,
    getRecipeDocumentByCloudId,
    listRecipeDocuments,
    type RecipeDocument,
} from '@/features/recipes/storage/recipeDocumentStorage'
import { setActiveLocalDataOwner } from '@/features/storage/localDataScope'

jest.mock('@/features/recipes/api/recipeDocumentsCloudRepo', () => ({ deleteCloudRecipeDocument: jest.fn() }))
jest.mock('@/features/recipes/storage/importsStorage', () => ({ deleteManagedImport: jest.fn(), listManagedImports: jest.fn() }))
jest.mock('@/features/recipes/storage/recipeDocumentStorage', () => ({
    deleteRecipeDocument: jest.fn(), getRecipeDocument: jest.fn(),
    getRecipeDocumentByCloudId: jest.fn(), listRecipeDocuments: jest.fn(),
}))

let documents: RecipeDocument[]
const localDocument: RecipeDocument = {
    id: 'local-document', cloudId: 'cloud-document', title: 'Fixture',
    fileName: 'fixture.pdf', fileUri: 'file:///fixture.pdf', fileSize: 100, createdAt: '2026-11-16T12:00:00Z',
}

beforeEach(() => {
    jest.resetAllMocks()
    setActiveLocalDataOwner('account-a')
    documents = [{ ...localDocument }]
    jest.mocked(getRecipeDocument).mockImplementation(async (id) => documents.find((document) => document.id === id) ?? null)
    jest.mocked(getRecipeDocumentByCloudId).mockImplementation(async (id) => documents.find((document) => document.cloudId === id) ?? null)
    jest.mocked(listRecipeDocuments).mockImplementation(async () => [...documents])
    jest.mocked(listManagedImports).mockResolvedValue([])
    jest.mocked(deleteRecipeDocument).mockImplementation(async (id) => { documents = documents.filter((document) => document.id !== id) })
    jest.mocked(deleteCloudRecipeDocument).mockResolvedValue(undefined)
})

afterEach(() => setActiveLocalDataOwner(null))

it.each(['local-document', 'cloud-document'])('deletes both cloud and offline copies when addressed by %s', async (id) => {
    const result = await deleteImport({ id, source: 'document', useLocalData: false })
    expect(deleteCloudRecipeDocument).toHaveBeenCalledWith('cloud-document')
    expect(deleteRecipeDocument).toHaveBeenCalledWith('local-document')
    expect(documents).toEqual([])
    expect(result.ids).toEqual(expect.arrayContaining(['local-document', 'cloud-document']))
    expect(jest.mocked(deleteCloudRecipeDocument).mock.invocationCallOrder[0])
        .toBeLessThan(jest.mocked(deleteRecipeDocument).mock.invocationCallOrder[0])
})

it('keeps the local file when cloud deletion fails instead of reporting success', async () => {
    jest.mocked(deleteCloudRecipeDocument).mockRejectedValue(new Error('Storage unavailable'))
    await expect(deleteImport({ id: 'cloud-document', source: 'document', useLocalData: false })).rejects.toThrow('Storage unavailable')
    expect(deleteRecipeDocument).not.toHaveBeenCalled()
    expect(documents).toHaveLength(1)
})

it('maps an import registry ID to its canonical document before deleting', async () => {
    jest.mocked(listManagedImports).mockResolvedValue([{
        id: 'registry-id', documentId: 'local-document', cloudId: 'cloud-document', kind: 'document',
        title: 'Fixture', fileName: 'fixture.pdf', fileUri: 'file:///fixture.pdf', bytes: 100, createdAt: localDocument.createdAt,
    }])
    const result = await deleteImport({ id: 'registry-id', source: 'managed', useLocalData: false })
    expect(deleteCloudRecipeDocument).toHaveBeenCalledWith('cloud-document')
    expect(deleteManagedImport).not.toHaveBeenCalled()
    expect(result.ids).toEqual(expect.arrayContaining(['registry-id', 'local-document', 'cloud-document']))
    expect(documents).toEqual([])
})

it('deletes an unsynced local import without sending its local ID to the cloud', async () => {
    documents[0].cloudId = null
    await deleteImport({ id: 'local-document', source: 'document', useLocalData: false })
    expect(deleteCloudRecipeDocument).not.toHaveBeenCalled()
    expect(documents).toEqual([])
})

it('keeps Free/device-only deletion local even for a cached cloud document', async () => {
    await deleteImport({ id: 'local-document', source: 'document', useLocalData: true })
    expect(deleteCloudRecipeDocument).not.toHaveBeenCalled()
    expect(documents).toEqual([])
})

it('removes all mirrors of a cloud record while preserving other imports', async () => {
    documents.push({ ...localDocument, id: 'second-mirror' }, { ...localDocument, id: 'unrelated-local', cloudId: 'unrelated-cloud' })
    await deleteImport({ id: 'cloud-document', source: 'document', useLocalData: false })
    expect(documents.map((document) => document.id)).toEqual(['unrelated-local'])
})

it('waits for an in-flight upload, then deletes its newly assigned cloud record', async () => {
    documents[0].cloudId = null
    let finishUpload!: () => void
    let uploadStarted!: () => void
    const started = new Promise<void>((resolve) => { uploadStarted = resolve })
    const upload = runRecipeDocumentOperation('account-a', async () => {
        uploadStarted()
        await new Promise<void>((resolve) => { finishUpload = resolve })
        documents[0].cloudId = 'new-cloud-document'
    })
    await started
    const deletion = deleteImport({ id: 'local-document', source: 'document', useLocalData: false })
    expect(deleteRecipeDocument).not.toHaveBeenCalled()
    finishUpload()
    await Promise.all([upload, deletion])
    expect(deleteCloudRecipeDocument).toHaveBeenCalledWith('new-cloud-document')
    expect(documents).toEqual([])
})

it('does not execute queued deletion under another account', async () => {
    let finish!: () => void
    const previous = runRecipeDocumentOperation('account-a', () => new Promise<void>((resolve) => { finish = resolve }))
    await Promise.resolve()
    await Promise.resolve()
    const deletion = deleteImport({ id: 'local-document', source: 'document', useLocalData: false })
    const rejected = expect(deletion).rejects.toThrow('active account changed')
    setActiveLocalDataOwner('account-b')
    finish()
    await previous
    await rejected
    expect(deleteCloudRecipeDocument).not.toHaveBeenCalled()
    expect(deleteRecipeDocument).not.toHaveBeenCalled()
})
