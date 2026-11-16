import { act, renderHook } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

import { useImportDeletion } from '../useImportDeletion'
import { deleteImport } from '@/features/recipes/services/deleteImport'
import { setActiveLocalDataOwner } from '@/features/storage/localDataScope'

jest.mock('@/features/recipes/services/deleteImport', () => ({ deleteImport: jest.fn() }))
jest.mock('@/features/storage/hooks/useStorageDataMode', () => ({ useStorageDataMode: () => ({ shouldUseLocalData: false }) }))

const listKey = ['recipes', 'documents', 'cloud', 'account-a']
const managedKey = ['recipes', 'imports', 'managed', 'cloud', 'account-a']
const detailKey = [...listKey, 'cloud-document', 'all']
let queryClient: QueryClient

beforeEach(() => {
    setActiveLocalDataOwner('account-a')
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { gcTime: 0 } } })
    jest.mocked(deleteImport).mockReset().mockResolvedValue({ ownerUserId: 'account-a', ids: ['cloud-document', 'local-document'] })
})
afterEach(() => { queryClient.clear(); setActiveLocalDataOwner(null) })

function wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

it('removes cloud/local aliases from every list page, registry and cached detail', async () => {
    const keep = { id: 'keep-document' }
    queryClient.setQueryData(listKey, { pages: [
        { items: [{ id: 'cloud-document' }, keep], nextCursor: { id: 'cursor' } },
        { items: [{ id: 'local-document', cloudId: 'cloud-document' }], nextCursor: null },
    ], pageParams: [null, { id: 'cursor' }] })
    queryClient.setQueryData(managedKey, { pages: [{ items: [{ id: 'registry-id', documentId: 'local-document' }, keep] }], pageParams: [null] })
    queryClient.setQueryData(detailKey, { id: 'local-document', cloudId: 'cloud-document', fileUri: 'file:///fixture.pdf' })
    const { result, unmount } = await renderHook(() => useImportDeletion('document', 'auth'), { wrapper })
    await act(async () => { await result.current.mutateAsync('cloud-document') })
    expect(queryClient.getQueryData(listKey)).toMatchObject({ pages: [{ items: [keep] }, { items: [] }] })
    expect(queryClient.getQueryData(managedKey)).toMatchObject({ pages: [{ items: [keep] }] })
    expect(queryClient.getQueryData(detailKey)).toBeNull()
    unmount()
})

it('preserves list/detail caches when deletion fails', async () => {
    const detail = { id: 'cloud-document', fileUri: 'file:///fixture.pdf' }
    queryClient.setQueryData(detailKey, detail)
    jest.mocked(deleteImport).mockRejectedValue(new Error('Network unavailable'))
    const { result, unmount } = await renderHook(() => useImportDeletion('managed', 'auth'), { wrapper })
    await act(async () => { await expect(result.current.mutateAsync('cloud-document')).rejects.toThrow('Network unavailable') })
    expect(queryClient.getQueryData(detailKey)).toEqual(detail)
    unmount()
})

it('cancels a stale in-flight detail response so it cannot reopen the deleted import', async () => {
    let resolveRequest!: (value: { id: string }) => void
    const request = queryClient.fetchQuery({ queryKey: detailKey, queryFn: () => new Promise<{ id: string }>((resolve) => { resolveRequest = resolve }) })
    const cancelled = request.catch(() => undefined)
    const { result, unmount } = await renderHook(() => useImportDeletion('document', 'auth'), { wrapper })
    await act(async () => { await result.current.mutateAsync('cloud-document') })
    resolveRequest({ id: 'cloud-document' })
    await cancelled
    expect(queryClient.getQueryData<{ id: string }>(detailKey)?.id).not.toBe('cloud-document')
    unmount()
})
