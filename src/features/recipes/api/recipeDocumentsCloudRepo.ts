import { supabase } from '@/lib/supabase'

import type { ManagedImport } from '@/features/recipes/storage/importsStorage'
import type { RecipeDocument, RecipeDocumentUsageSummary } from '@/features/recipes/storage/recipeDocumentStorage'

const SIGNED_URL_TTL_SECONDS = 60 * 60
export const CLOUD_RECIPE_DOCUMENTS_PAGE_SIZE = 50
const VISIBLE_IMPORT_STATUSES = ['uploading', 'uploaded', 'processing', 'ready']

type RecipeDocumentImportRow = {
  id: string
  title: string | null
  original_file_name: string
  storage_bucket: string
  storage_path: string
  mime_type: string
  bytes: number
  status?: string
  created_at: string
}

type RecipeDocumentUsageRow = {
  total_count: number | null
  total_bytes: number | null
}

export type CloudRecipeDocumentsCursor = {
  createdAt: string
  id: string
}

export type CloudRecipeDocumentsPage<TItem> = {
  items: TItem[]
  nextCursor: CloudRecipeDocumentsCursor | null
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

function isMissingStatusColumnError(error: { message?: string; code?: string } | null | undefined) {
  return error?.code === '42703' || /status.*does not exist/i.test(error?.message ?? '')
}

async function requireUserId() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  const userId = data.session?.user?.id
  if (!userId) throw new Error('Not authenticated')
  return userId
}

export async function listCloudRecipeDocuments(): Promise<RecipeDocument[]> {
  const firstPage = await listCloudRecipeDocumentsPage()
  return firstPage.items
}

export async function listCloudManagedImports(): Promise<ManagedImport[]> {
  const firstPage = await listCloudManagedImportsPage()
  return firstPage.items
}

async function fetchCloudRecipeDocumentImportsPage(params?: {
  cursor?: CloudRecipeDocumentsCursor | null
  limit?: number
}): Promise<RecipeDocumentImportRow[]> {
  return fetchCloudRecipeDocumentImportsPageDirect(params)
}

async function fetchCloudRecipeDocumentImportsPageDirect(params?: {
  cursor?: CloudRecipeDocumentsCursor | null
  limit?: number
}): Promise<RecipeDocumentImportRow[]> {
  const limit = Math.max(1, Math.min(params?.limit ?? CLOUD_RECIPE_DOCUMENTS_PAGE_SIZE, 100))
  const userId = await requireUserId()

  let query = supabase
    .from('recipe_document_imports')
    .select('id,title,original_file_name,storage_bucket,storage_path,mime_type,bytes,status,created_at')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .in('status', VISIBLE_IMPORT_STATUSES)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit)

  if (params?.cursor?.createdAt && params.cursor.id) {
    query = query.or(
      `created_at.lt.${params.cursor.createdAt},and(created_at.eq.${params.cursor.createdAt},id.lt.${params.cursor.id})`
    )
  }

  const { data, error } = await query
  if (!error) return (data ?? []) as RecipeDocumentImportRow[]
  if (!isMissingStatusColumnError(error)) throw error

  let legacyQuery = supabase
    .from('recipe_document_imports')
    .select('id,title,original_file_name,storage_bucket,storage_path,mime_type,bytes,created_at')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit)

  if (params?.cursor?.createdAt && params.cursor.id) {
    legacyQuery = legacyQuery.or(
      `created_at.lt.${params.cursor.createdAt},and(created_at.eq.${params.cursor.createdAt},id.lt.${params.cursor.id})`
    )
  }

  const { data: legacyData, error: legacyError } = await legacyQuery
  if (legacyError) throw legacyError
  return (legacyData ?? []) as RecipeDocumentImportRow[]
}

async function fetchCloudRecipeDocumentDirect(id: string): Promise<RecipeDocumentImportRow | null> {
  const userId = await requireUserId()
  const { data, error } = await supabase
    .from('recipe_document_imports')
    .select('id,title,original_file_name,storage_bucket,storage_path,mime_type,bytes,status,created_at')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .in('status', VISIBLE_IMPORT_STATUSES)
    .eq('id', id)
    .maybeSingle()

  if (!error) return data as RecipeDocumentImportRow | null
  if (!isMissingStatusColumnError(error)) throw error

  const { data: legacyData, error: legacyError } = await supabase
    .from('recipe_document_imports')
    .select('id,title,original_file_name,storage_bucket,storage_path,mime_type,bytes,created_at')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .eq('id', id)
    .maybeSingle()

  if (legacyError) throw legacyError
  return legacyData as RecipeDocumentImportRow | null
}

function buildNextCursor(
  rows: RecipeDocumentImportRow[],
  limit = CLOUD_RECIPE_DOCUMENTS_PAGE_SIZE
): CloudRecipeDocumentsCursor | null {
  if (rows.length < limit) return null
  const lastRow = rows[rows.length - 1]
  if (!lastRow?.created_at || !lastRow?.id) return null
  return {
    createdAt: lastRow.created_at,
    id: lastRow.id,
  }
}

export async function listCloudRecipeDocumentsPage(params?: {
  cursor?: CloudRecipeDocumentsCursor | null
  limit?: number
}): Promise<CloudRecipeDocumentsPage<RecipeDocument>> {
  const rows = await fetchCloudRecipeDocumentImportsPage(params)
  return {
    items: rows.map((row) => mapRecipeDocument(row)),
    nextCursor: buildNextCursor(rows, params?.limit),
  }
}

export async function listCloudManagedImportsPage(params?: {
  cursor?: CloudRecipeDocumentsCursor | null
  limit?: number
}): Promise<CloudRecipeDocumentsPage<ManagedImport>> {
  const rows = await fetchCloudRecipeDocumentImportsPage(params)
  return {
    items: rows.map((row) => mapManagedImport(row)),
    nextCursor: buildNextCursor(rows, params?.limit),
  }
}

export async function getCloudRecipeDocument(id: string): Promise<RecipeDocument | null> {
  const row = await fetchCloudRecipeDocumentDirect(id)
  if (!row) return null

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

export async function updateCloudRecipeDocumentTitle(input: {
  id: string
  title: string
}): Promise<void> {
  const title = input.title.trim()
  if (!title) throw new Error('Import name is required.')

  const { error } = await supabase.rpc('update_recipe_document_import_title', {
    p_document_id: input.id,
    p_title: title,
  })

  if (error) throw error
}

export async function deleteCloudRecipeDocument(id: string): Promise<void> {
  const row = await fetchCloudRecipeDocumentDirect(id)
  if (!row) return

  const { error: storageError } = await supabase.storage
    .from(row.storage_bucket)
    .remove([row.storage_path])

  if (storageError) throw storageError

  const { error } = await supabase.rpc('delete_recipe_document_import', {
    p_document_id: id,
  })

  if (error) throw error
}
