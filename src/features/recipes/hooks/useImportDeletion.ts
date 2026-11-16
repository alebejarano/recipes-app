import { useMutation, useQueryClient } from '@tanstack/react-query'

import { deleteImport } from '@/features/recipes/services/deleteImport'
import { useStorageDataMode, type StorageScreenMode } from '@/features/storage/hooks/useStorageDataMode'
import { getActiveLocalDataOwner } from '@/features/storage/localDataScope'

function matchesDeletedImport(value: unknown, ids: ReadonlySet<string>): boolean {
    if (!value || typeof value !== 'object') return false
    return ['id', 'cloudId', 'documentId'].some((key) => {
        const id = (value as Record<string, unknown>)[key]
        return typeof id === 'string' && ids.has(id)
    })
}

function removeDeletedImport(value: unknown, ids: ReadonlySet<string>): unknown {
    if (!value || typeof value !== 'object') return value
    if (Array.isArray(value)) return value.filter((item) => !matchesDeletedImport(item, ids))
    if ('pages' in value && Array.isArray(value.pages)) {
        return {
            ...value,
            pages: value.pages.map((page: { items: unknown[] }) => ({
                ...page,
                items: page.items.filter((item) => !matchesDeletedImport(item, ids)),
            })),
        }
    }
    return matchesDeletedImport(value, ids) ? null : value
}

export function useImportDeletion(source: 'document' | 'managed', mode: StorageScreenMode) {
    const queryClient = useQueryClient()
    const { shouldUseLocalData } = useStorageDataMode(mode)
    return useMutation({
        mutationFn: (id: string) => deleteImport({ id, source, useLocalData: shouldUseLocalData }),
        onMutate: async () => {
            // A list/detail request started before deletion must not restore its
            // old result after the successful mutation updates the cache.
            await Promise.all([
                queryClient.cancelQueries({ queryKey: ['recipes', 'documents'] }),
                queryClient.cancelQueries({ queryKey: ['recipes', 'imports', 'managed'] }),
            ])
        },
        onSuccess: async (deleted) => {
            if (getActiveLocalDataOwner() !== deleted.ownerUserId) return
            const ids = new Set(deleted.ids)
            for (const queryKey of [['recipes', 'documents'], ['recipes', 'imports', 'managed']]) {
                queryClient.setQueriesData({ queryKey }, (value) => removeDeletedImport(value, ids))
            }
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['recipes', 'documents'] }),
                queryClient.invalidateQueries({ queryKey: ['recipes', 'imports', 'managed'] }),
                queryClient.invalidateQueries({ queryKey: ['recipes', 'library', 'free-active-imports'] }),
            ])
        },
    })
}
