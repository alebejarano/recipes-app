import * as Sharing from 'expo-sharing'

import { listLocalFoldersRepo } from '@/features/folders/api/foldersLocalRepo'
import { type StorageStrategy } from '@/features/storage/context/StorageStrategyContext'
import { listLocalNotes } from '@/features/notes/storage/localNotesStorage'
import { listLocalRecipes } from '@/features/recipes/storage/localRecipesStorage'
import { listRecipeDocuments } from '@/features/recipes/storage/recipeDocumentStorage'
import { getShoppingListItems } from '@/features/shopping-list/storage/shoppingListItemsStorage'
import { getShoppingListId } from '@/features/shopping-list/storage/shoppingListStorage'
import { Directory, File, Paths } from '@/lib/fileSystem'

const EXPORTED_DATA_DIR = new Directory(Paths.cache, 'exported-data')
const EXPORT_LIMIT = 5000

function safeFileName(input: string) {
  const normalized = input.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, '-')
  const collapsed = normalized.replace(/-+/g, '-').replace(/^-|-$/g, '')
  return collapsed || 'Dropsauce-data'
}

export type ExportUserDataInput = {
  userId: string | null
  email: string | null
  displayName: string | null
  storageStrategy: StorageStrategy
}

type ExportUserDataPayload = {
  schemaVersion: 1
  exportedAt: string
  account: ExportUserDataInput
  recipes: Awaited<ReturnType<typeof listLocalRecipes>>
  notes: Awaited<ReturnType<typeof listLocalNotes>>
  folders: Awaited<ReturnType<typeof listLocalFoldersRepo>>
  recipeDocuments: Awaited<ReturnType<typeof listRecipeDocuments>>
  shoppingList: {
    id: string | null
    items: Awaited<ReturnType<typeof getShoppingListItems>>
  }
}

async function buildExportPayload(account: ExportUserDataInput): Promise<ExportUserDataPayload> {
  const [recipes, notes, folders, recipeDocuments, shoppingListId, shoppingListItems] =
    await Promise.all([
      listLocalRecipes({ limit: EXPORT_LIMIT }),
      listLocalNotes({ limit: EXPORT_LIMIT }),
      listLocalFoldersRepo({ limit: EXPORT_LIMIT }),
      listRecipeDocuments(),
      getShoppingListId(),
      getShoppingListItems(),
    ])

  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    account,
    recipes,
    notes,
    folders,
    recipeDocuments: recipeDocuments.map((document) => ({
      id: document.id,
      title: document.title,
      fileName: document.fileName,
      fileUri: document.fileUri,
      fileSize: document.fileSize,
      createdAt: document.createdAt,
    })),
    shoppingList: {
      id: shoppingListId,
      items: shoppingListItems,
    },
  }
}

export async function exportUserData(account: ExportUserDataInput) {
  const sharingAvailable = await Sharing.isAvailableAsync()
  if (!sharingAvailable) {
    throw new Error('Sharing is not available on this device.')
  }

  if (!EXPORTED_DATA_DIR.exists) {
    EXPORTED_DATA_DIR.create({ intermediates: true, idempotent: true })
  }

  const payload = await buildExportPayload(account)
  const baseName = safeFileName(account.email ?? account.displayName ?? 'Dropsauce-data')
  const file = new File(EXPORTED_DATA_DIR, `${baseName}-${Date.now()}.json`)
  file.create({ intermediates: true, overwrite: true })
  file.write(JSON.stringify(payload, null, 2))

  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Export recipes and data',
    UTI: 'public.json',
  })
}
