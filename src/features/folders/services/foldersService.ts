import {
  createFolder as createCloudFolder,
  deleteFolderWithRecipes as deleteCloudFolderWithRecipes,
  listFolders as listCloudFolders,
  type Folder,
  updateFolder as updateCloudFolder,
} from '@/features/folders/api/foldersCloudRepo'
import {
  createLocalFolderRepo,
  deleteLocalFolderRepo,
  listLocalFoldersRepo,
  updateLocalFolderRepo,
} from '@/features/folders/api/foldersLocalRepo'
import type { StorageScreenMode } from '@/features/storage/hooks/useStorageDataMode'

export type FolderStorageTarget = 'local' | 'cloud'

type FolderServiceContext = {
  mode: StorageScreenMode
  canUseCloudSync: boolean
}

type CreateFolderInput = {
  name: string
  emoji?: string | null
}

type UpdateFolderInput = {
  id: string
  name: string
  emoji?: string | null
}

export function resolveFolderStorageTarget({
  mode,
  canUseCloudSync,
}: FolderServiceContext): FolderStorageTarget {
  if (mode === 'public') return 'local'
  if (mode === 'dev') return 'cloud'
  return canUseCloudSync ? 'cloud' : 'local'
}

export async function listFoldersForStrategy(
  context: FolderServiceContext,
  params?: { limit?: number; search?: string }
): Promise<Folder[]> {
  const target = resolveFolderStorageTarget(context)
  if (target === 'local') {
    return listLocalFoldersRepo(params)
  }

  const all = await listCloudFolders()
  const search = params?.search?.trim().toLowerCase()
  const filtered = search
    ? all.filter((folder) => folder.name.toLowerCase().includes(search))
    : all
  const limit = params?.limit
  return typeof limit === 'number' ? filtered.slice(0, limit) : filtered
}

export async function createFolderForStrategy(
  context: FolderServiceContext,
  input: CreateFolderInput
): Promise<Folder> {
  const target = resolveFolderStorageTarget(context)
  return target === 'cloud' ? createCloudFolder(input) : createLocalFolderRepo(input)
}

export async function updateFolderForStrategy(
  context: FolderServiceContext,
  input: UpdateFolderInput
): Promise<Folder> {
  const target = resolveFolderStorageTarget(context)
  return target === 'cloud' ? updateCloudFolder(input) : updateLocalFolderRepo(input)
}

export async function deleteFolderForStrategy(
  context: FolderServiceContext,
  folderId: string
): Promise<void> {
  const target = resolveFolderStorageTarget(context)
  if (target === 'cloud') {
    await deleteCloudFolderWithRecipes({ id: folderId })
    return
  }
  await deleteLocalFolderRepo(folderId)
}
