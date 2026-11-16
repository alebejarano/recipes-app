import { supabase } from '@/lib/supabase'
import { deleteCloudRecipeDocument, listDeletedCloudRecipeDocumentIds } from '../recipeDocumentsCloudRepo'

jest.mock('@/lib/supabase', () => ({
    supabase: { auth: { getSession: jest.fn() }, from: jest.fn(), rpc: jest.fn(), storage: { from: jest.fn() } },
}))

const remove = jest.fn()
const query = {
    select: jest.fn(), eq: jest.fn(), not: jest.fn(), in: jest.fn(), maybeSingle: jest.fn(),
}
beforeEach(() => {
    jest.resetAllMocks()
    jest.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: { user: { id: 'account-a' } } }, error: null } as never)
    jest.mocked(supabase.from).mockReturnValue(query as never)
    query.select.mockReturnValue(query); query.eq.mockReturnValue(query); query.not.mockReturnValue(query)
    query.maybeSingle.mockResolvedValue({ data: { id: 'document', storage_bucket: 'recipe-imports', storage_path: 'account-a/fixture.pdf' }, error: null })
    query.in.mockResolvedValue({ data: [], error: null })
    jest.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as never)
    jest.mocked(supabase.storage.from).mockReturnValue({ remove } as never)
    remove.mockResolvedValue({ data: [{ name: 'account-a/fixture.pdf' }], error: null })
})

it('marks metadata deleted before removing the owned Storage object', async () => {
    await deleteCloudRecipeDocument('document')
    expect(supabase.rpc).toHaveBeenCalledWith('delete_recipe_document_import', { p_document_id: 'document' })
    expect(remove).toHaveBeenCalledWith(['account-a/fixture.pdf'])
    expect(jest.mocked(supabase.rpc).mock.invocationCallOrder[0]).toBeLessThan(remove.mock.invocationCallOrder[0])
    expect(query.eq).toHaveBeenCalledWith('user_id', 'account-a')
    // Do not exclude tombstones: deletion must be retryable after Storage fails.
    expect(query.not).not.toHaveBeenCalled()
})

it('rejects an unknown/incorrect ID instead of reporting a successful no-op', async () => {
    query.maybeSingle.mockResolvedValue({ data: null, error: null })
    await expect(deleteCloudRecipeDocument('registry-id')).rejects.toThrow('Import not found')
    expect(supabase.rpc).not.toHaveBeenCalled()
    expect(remove).not.toHaveBeenCalled()
})

it('does not remove Storage when metadata deletion is denied', async () => {
    jest.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: 'Denied' } } as never)
    await expect(deleteCloudRecipeDocument('document')).rejects.toMatchObject({ message: 'Denied' })
    expect(remove).not.toHaveBeenCalled()
})

it('reports Storage failures and allows a later retry against the retained tombstone', async () => {
    remove.mockResolvedValueOnce({ error: { message: 'Storage unavailable' } })
    await expect(deleteCloudRecipeDocument('document')).rejects.toMatchObject({ message: 'Storage unavailable' })
    await expect(deleteCloudRecipeDocument('document')).resolves.toBeUndefined()
    expect(remove).toHaveBeenCalledTimes(2)
})

it('queries explicit deletion markers in bounded batches rather than inferring missing imports', async () => {
    const ids = Array.from({ length: 101 }, (_, index) => `document-${index}`)
    query.in.mockResolvedValueOnce({ data: [{ id: ids[4] }], error: null })
    expect(await listDeletedCloudRecipeDocumentIds(ids)).toEqual([ids[4]])
    expect(query.not).toHaveBeenCalledWith('deleted_at', 'is', null)
    expect(query.in).toHaveBeenNthCalledWith(1, 'id', ids.slice(0, 100))
    expect(query.in).toHaveBeenNthCalledWith(2, 'id', ids.slice(100))
})
