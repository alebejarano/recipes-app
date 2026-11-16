import { deleteCloudRecipeDocument } from '@/features/recipes/api/recipeDocumentsCloudRepo'
import { deleteManagedImport, listManagedImports } from '@/features/recipes/storage/importsStorage'
import {
    deleteRecipeDocument,
    getRecipeDocument,
    getRecipeDocumentByCloudId,
    listRecipeDocuments,
} from '@/features/recipes/storage/recipeDocumentStorage'
import { runRecipeDocumentOperation } from '@/features/recipes/services/recipeDocumentOperations'
import { getActiveLocalDataOwner } from '@/features/storage/localDataScope'

export type DeletedImport = {
    ownerUserId: string | null
    ids: string[]
}

async function deleteDocument(id: string, useLocalData: boolean): Promise<string[]> {
    const localDocument = await getRecipeDocument(id) ?? await getRecipeDocumentByCloudId(id)
    if (useLocalData || (localDocument && !localDocument.cloudId)) {
        await deleteRecipeDocument(localDocument?.id ?? id)
        return [id, localDocument?.id, localDocument?.cloudId].filter((value): value is string => Boolean(value))
    }

    const cloudId = localDocument?.cloudId ?? id
    // Never discard the only offline copy when the authoritative deletion fails.
    await deleteCloudRecipeDocument(cloudId)
    const mirrors = (await listRecipeDocuments()).filter((document) => document.cloudId === cloudId)
    for (const document of mirrors) await deleteRecipeDocument(document.id)
    return [id, cloudId, ...mirrors.map((document) => document.id)]
}

export function deleteImport(input: {
    id: string
    source: 'document' | 'managed'
    useLocalData: boolean
}): Promise<DeletedImport> {
    const ownerUserId = getActiveLocalDataOwner()
    return runRecipeDocumentOperation(ownerUserId, async () => {
        let ids: string[]
        if (input.source === 'managed') {
            // Registry IDs, local document IDs and cloud IDs are different.
            const managed = (await listManagedImports()).find((item) => item.id === input.id)
            if (managed?.kind === 'document' && managed.documentId) {
                ids = await deleteDocument(managed.documentId, input.useLocalData)
            } else if (input.useLocalData || managed) {
                await deleteManagedImport(input.id)
                ids = [input.id]
            } else {
                ids = await deleteDocument(input.id, false)
            }
        } else {
            ids = await deleteDocument(input.id, input.useLocalData)
        }
        return { ownerUserId, ids: [...new Set([input.id, ...ids])] }
    })
}
