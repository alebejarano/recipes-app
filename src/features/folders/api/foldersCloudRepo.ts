import { supabase } from '@/lib/supabase'
import {
  removeFolderFromLocalRecipesByName,
  renameFolderInLocalRecipesByName,
} from '@/features/recipes/storage/localRecipesStorage'

async function requireAuth() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  if (!data.session?.user) throw new Error('Not authenticated')
  return data.session.user
}

export type Folder = {
  id: string
  clientId: string | null
  name: string
  emoji: string
  createdAt: string
}

type FolderRow = {
  id: string
  client_id: string | null
  name: string
  emoji: string | null
  created_at: string
}

function mapFolder(row: FolderRow): Folder {
  return {
    id: row.id,
    clientId: row.client_id ?? null,
    name: row.name,
    emoji: row.emoji ?? '📁',
    createdAt: row.created_at,
  }
}

function isFavoritesFolderName(name: string) {
  const normalized = name.trim().toLowerCase()
  return normalized === 'favorites' || normalized === 'favourites'
}

export async function listFolders(): Promise<Folder[]> {
  const { data, error } = await supabase
    .from('folders')
    .select('id,client_id,name,emoji,created_at')
    .order('name', { ascending: true })

  if (error) throw error
  return (data ?? []).map((row) => mapFolder(row as FolderRow))
}

/**
 * Favorites is a system folder. Older local-first syncs could create a second
 * cloud row for it, so merge its recipe links into the oldest row and remove
 * the duplicate safely.
 */
export async function reconcileDuplicateFavoriteFolders(folders: Folder[]): Promise<Folder[]> {
  const favorites = folders
    .filter((folder) => isFavoritesFolderName(folder.name))
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id))

  if (favorites.length < 2) return folders

  const canonical = favorites[0]
  const duplicateIds = favorites.slice(1).map((folder) => folder.id)

  for (const duplicateId of duplicateIds) {
    const { data: links, error: linksError } = await supabase
      .from('recipe_folders')
      .select('recipe_id')
      .eq('folder_id', duplicateId)
    if (linksError) throw linksError

    const canonicalLinks = (links ?? [])
      .map((link) => link.recipe_id)
      .filter((recipeId): recipeId is string => typeof recipeId === 'string' && recipeId.length > 0)
      .map((recipeId) => ({ recipe_id: recipeId, folder_id: canonical.id }))

    if (canonicalLinks.length > 0) {
      const { error: insertError } = await supabase
        .from('recipe_folders')
        .upsert(canonicalLinks, { onConflict: 'recipe_id,folder_id', ignoreDuplicates: true })
      if (insertError) throw insertError
    }

    const { error: unlinkError } = await supabase
      .from('recipe_folders')
      .delete()
      .eq('folder_id', duplicateId)
    if (unlinkError) throw unlinkError

    const { error: deleteError } = await supabase.from('folders').delete().eq('id', duplicateId)
    if (deleteError) throw deleteError
  }

  return folders.filter((folder) => !duplicateIds.includes(folder.id))
}

export async function createFolder(input: { name: string; emoji?: string | null }) {
  const user = await requireAuth()
  const name = input.name.trim()
  if (!name) throw new Error('Folder name is required')

  const emoji = input.emoji?.trim() || '📁'

  const { data, error } = await supabase
    .from('folders')
    .insert({ user_id: user.id, name, emoji })
    .select('id,client_id,name,emoji,created_at')
    .single()

  if (error) throw error
  if (!data) throw new Error('Create folder failed')

  return mapFolder(data as FolderRow)
}

export async function updateFolder(input: {
  id: string
  name: string
  emoji?: string | null
}): Promise<Folder> {
  const name = input.name.trim()
  if (!name) throw new Error('Folder name is required')

  const emoji = input.emoji?.trim() || '📁'
  const { data: existing, error: existingError } = await supabase
    .from('folders')
    .select('name,emoji')
    .eq('id', input.id)
    .maybeSingle()

  if (existingError) throw existingError

  const { data, error } = await supabase
    .from('folders')
    .update({ name, emoji })
    .eq('id', input.id)
    .select('id,client_id,name,emoji,created_at')
    .single()

  if (error) throw error
  if (!data) throw new Error('Update folder failed')

  const previousName = typeof existing?.name === 'string' ? existing.name : ''
  if (previousName.trim().toLowerCase() !== name.toLowerCase()) {
    await renameFolderInLocalRecipesByName({
      fromName: previousName,
      toName: name,
      emoji,
    })
  }

  return mapFolder(data as FolderRow)
}

export async function deleteFolderWithRecipes(input: { id: string }): Promise<void> {
  const { data: folderRow, error: folderError } = await supabase
    .from('folders')
    .select('name')
    .eq('id', input.id)
    .maybeSingle()

  if (folderError) throw folderError
  const folderName = typeof folderRow?.name === 'string' ? folderRow.name : ''

  if (isFavoritesFolderName(folderName)) {
    const { error: unlinkError } = await supabase
      .from('recipe_folders')
      .delete()
      .eq('folder_id', input.id)
    if (unlinkError) throw unlinkError

    const { error: deleteFolderError } = await supabase.from('folders').delete().eq('id', input.id)
    if (deleteFolderError) throw deleteFolderError
    await removeFolderFromLocalRecipesByName(folderName)
    return
  }

  const { data: links, error: linksError } = await supabase
    .from('recipe_folders')
    .select('recipe_id')
    .eq('folder_id', input.id)

  if (linksError) throw linksError

  const recipeIds = (links ?? []).map((row) => row.recipe_id).filter(Boolean)

  if (recipeIds.length > 0) {
    const { error: deleteRecipesError } = await supabase
      .from('recipes')
      .delete()
      .in('id', recipeIds)

    if (deleteRecipesError) throw deleteRecipesError
  }

  const { error: deleteFolderError } = await supabase.from('folders').delete().eq('id', input.id)
  if (deleteFolderError) throw deleteFolderError
}
