import { supabase } from '@/lib/supabase'

import type { RecipeDocument } from '@/features/recipes/storage/recipeDocumentStorage'

const RECIPE_IMPORTS_BUCKET = 'recipe-imports'
const SIGNED_URL_TTL_SECONDS = 60 * 60

type StorageListItem = {
  name?: string | null
  created_at?: string | null
  updated_at?: string | null
  metadata?: {
    size?: number | string | null
  } | null
  id?: string | null
}

async function requireAuth() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  if (!data.session?.user) throw new Error('Not authenticated')
  return data.session.user
}

function inferTitleFromFileName(fileName: string) {
  const trimmed = fileName.trim()
  if (!trimmed) return null
  return trimmed.replace(/\.[^.]+$/, '') || trimmed
}

function toRecipeDocument(userId: string, item: StorageListItem): RecipeDocument | null {
  const fileName = item.name?.trim() ?? ''
  if (!fileName) return null

  const fileSize = Number(item.metadata?.size ?? 0)
  const createdAt = item.created_at ?? item.updated_at ?? new Date().toISOString()
  const storagePath = `${userId}/${fileName}`

  return {
    id: fileName,
    title: inferTitleFromFileName(fileName),
    fileName,
    fileUri: storagePath,
    fileSize: Number.isFinite(fileSize) ? fileSize : 0,
    createdAt,
  }
}

export async function listCloudRecipeDocuments(): Promise<RecipeDocument[]> {
  const user = await requireAuth()
  const { data, error } = await supabase.storage
    .from(RECIPE_IMPORTS_BUCKET)
    .list(user.id, {
      limit: 1000,
      offset: 0,
    })

  if (error) throw error

  return (data ?? [])
    .map((item) => toRecipeDocument(user.id, item as StorageListItem))
    .filter((item): item is RecipeDocument => Boolean(item))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function getCloudRecipeDocument(id: string): Promise<RecipeDocument | null> {
  const user = await requireAuth()
  const documents = await listCloudRecipeDocuments()
  const document = documents.find((item) => item.id === id)
  if (!document) return null

  const storagePath = `${user.id}/${id}`
  const { data, error } = await supabase.storage
    .from(RECIPE_IMPORTS_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS)

  if (error) throw error

  return {
    ...document,
    fileUri: data?.signedUrl ?? document.fileUri,
  }
}

export async function deleteCloudRecipeDocument(id: string): Promise<void> {
  const user = await requireAuth()
  const storagePath = `${user.id}/${id}`
  const { error } = await supabase.storage
    .from(RECIPE_IMPORTS_BUCKET)
    .remove([storagePath])

  if (error) throw error
}
