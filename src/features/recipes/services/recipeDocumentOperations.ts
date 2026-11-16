import { getActiveLocalDataOwner } from '@/features/storage/localDataScope'

// Uploads, downloads and deletion must not pass one another: an upload that
// finishes after a local delete otherwise recreates the import in the cloud.
const operationsByOwner = new Map<string, Promise<unknown>>()

export function runRecipeDocumentOperation<T>(ownerUserId: string | null, operation: () => Promise<T>): Promise<T> {
    const scope = ownerUserId ?? 'guest'
    const previous = operationsByOwner.get(scope) ?? Promise.resolve()
    const result = previous.catch(() => undefined).then(() => {
        if (getActiveLocalDataOwner() !== ownerUserId) {
            throw new Error('The active account changed. Please try again.')
        }
        return operation()
    })
    operationsByOwner.set(scope, result)
    void result.finally(() => {
        if (operationsByOwner.get(scope) === result) operationsByOwner.delete(scope)
    }).catch(() => undefined)
    return result
}
