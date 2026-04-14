import { supabase } from '@/lib/supabase'

import type { ManagedImport } from '@/features/recipes/storage/importsStorage'
import type { RecipeDocument, RecipeDocumentUsageSummary } from '@/features/recipes/storage/recipeDocumentStorage'

const SIGNED_URL_TTL_SECONDS = 60 * 60

type RecipeDocumentImportRow = {
  id: string
  title: string | null
  original_file_name: string
  storage_bucket: string
  storage_path: string
  mime_type: string
  bytes: number
  created_at: string
}

type RecipeDocumentUsageRow = {
  total_count: number | null
  total_bytes: number | null
}

function inferTitleFromFileName(fileName: string) {
  const trimmed = fileName.trim()
  if (!trimmed) return null
  return trimmed.replace(/\.[^.]+$/, '') || trimmed
}

function mapRecipeDocument(row: RecipeDocumentImportRow): RecipeDocument {
  return {
    id: row.id,
    title: row.title?.trim() || inferTitleFromFileName(row.original_file_name),
    fileName: row.original_file_name,
    fileUri: row.storage_path,
    fileSize: Number(row.bytes ?? 0),
    createdAt: row.created_at,
  }
}

function mapManagedImport(row: RecipeDocumentImportRow): ManagedImport {
  return {
    id: row.id,
    kind: 'document',
    title: row.title?.trim() || inferTitleFromFileName(row.original_file_name),
    fileName: row.original_file_name,
    fileUri: row.storage_path,
    bytes: Number(row.bytes ?? 0),
    createdAt: row.created_at,
  }
}

export async function listCloudRecipeDocuments(): Promise<RecipeDocument[]> {
  const { data, error } = await supabase
    .from('recipe_document_imports')
    .select('id,title,original_file_name,storage_bucket,storage_path,mime_type,bytes,created_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map((row) => mapRecipeDocument(row as RecipeDocumentImportRow))
}

export async function listCloudManagedImports(): Promise<ManagedImport[]> {
  const { data, error } = await supabase
    .from('recipe_document_imports')
    .select('id,title,original_file_name,storage_bucket,storage_path,mime_type,bytes,created_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map((row) => mapManagedImport(row as RecipeDocumentImportRow))
}

export async function getCloudRecipeDocument(id: string): Promise<RecipeDocument | null> {
  const { data, error } = await supabase
    .from('recipe_document_imports')
    .select('id,title,original_file_name,storage_bucket,storage_path,mime_type,bytes,created_at')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const row = data as RecipeDocumentImportRow
  const { data: signedData, error: signedError } = await supabase.storage
    .from(row.storage_bucket)
    .createSignedUrl(row.storage_path, SIGNED_URL_TTL_SECONDS)

  if (signedError) throw signedError

  return {
    ...mapRecipeDocument(row),
    fileUri: signedData?.signedUrl ?? row.storage_path,
  }
}

export async function getCloudRecipeDocumentUsageSummary(): Promise<RecipeDocumentUsageSummary> {
  const { data, error } = await supabase.rpc('get_recipe_document_import_usage')
  if (error) throw error

  const row = Array.isArray(data) ? (data[0] as RecipeDocumentUsageRow | undefined) : undefined
  return {
    totalCount: Number(row?.total_count ?? 0),
    totalBytes: Number(row?.total_bytes ?? 0),
  }
}

export async function deleteCloudRecipeDocument(id: string): Promise<void> {
  const { error } = await supabase.rpc('delete_recipe_document_import', {
    p_document_id: id,
  })

  if (error) throw error
}
