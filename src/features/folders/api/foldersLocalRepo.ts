import type { Folder } from '@/features/folders/api/foldersCloudRepo'
import {
  createLocalFolder,
  deleteLocalFolder,
  getLocalFolder,
  listLocalFolders,
  updateLocalFolder,
} from '@/features/folders/storage/localFoldersStorage'
import { removeFolderFromLocalRecipesByName } from '@/features/recipes/storage/localRecipesStorage'

function isFavoritesFolderName(name: string) {
  const normalized = name.trim().toLowerCase()
  return normalized === 'favorites' || normalized === 'favourites'
}

function toFolderShape(input: {
  id: string
  name: string
  emoji: string | null
  createdAt: string
}): Folder {
  return {
    id: input.id,
    name: input.name,
    emoji: input.emoji ?? '📁',
    createdAt: input.createdAt,
  }
}

export async function listLocalFoldersRepo(params?: {
  limit?: number
  search?: string
}): Promise<Folder[]> {
  const rows = await listLocalFolders(params)
  return rows.map(toFolderShape)
}

export async function createLocalFolderRepo(input: {
  name: string
  emoji?: string | null
}): Promise<Folder> {
  const row = await createLocalFolder(input)
  return toFolderShape(row)
}

export async function updateLocalFolderRepo(input: {
  id: string
  name: string
  emoji?: string | null
}): Promise<Folder> {
  const row = await updateLocalFolder(input)
  return toFolderShape(row)
}

export async function deleteLocalFolderRepo(id: string): Promise<void> {
  const folder = await getLocalFolder(id)
  if (folder && isFavoritesFolderName(folder.name)) {
    await removeFolderFromLocalRecipesByName(folder.name)
  }
  await deleteLocalFolder(id)
}
