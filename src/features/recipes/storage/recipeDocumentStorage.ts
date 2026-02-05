import { Directory, File, Paths } from 'expo-file-system'
import { Platform } from 'react-native'

import { getAllAsync, getFirstAsync, runSqlAsync, runSqlBatchAsync } from '@/lib/sqlite'

export type RecipeDocument = {
  id: string
  title: string | null
  fileName: string
  fileUri: string
  fileSize: number
  createdAt: string
}

export type PendingRecipeDocument = {
  uri: string
  name: string
  size: number
}

export type RecipeDocumentUsageSummary = {
  totalCount: number
  totalBytes: number
}

const DOCUMENTS_DIR = new Directory(Paths.document, 'recipe-documents')
const DOCUMENTS_BASE_URI = DOCUMENTS_DIR.uri.endsWith('/')
  ? DOCUMENTS_DIR.uri
  : `${DOCUMENTS_DIR.uri}/`

const MIGRATION_STATEMENTS = [
  {
    sql: `CREATE TABLE IF NOT EXISTS recipe_documents (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT,
      file_name TEXT NOT NULL,
      file_uri TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );`,
  },
  {
    sql: 'CREATE INDEX IF NOT EXISTS recipe_documents_created_at_idx ON recipe_documents(created_at);',
  },
]

let migrationsPromise: Promise<void> | null = null

export function ensureRecipeDocumentStorageReady() {
  if (!migrationsPromise) {
    migrationsPromise = runSqlBatchAsync(MIGRATION_STATEMENTS)
  }
  return migrationsPromise
}

function makeId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

async function ensureDir() {
  if (Platform.OS === 'web') return
  if (!DOCUMENTS_DIR.exists) {
    DOCUMENTS_DIR.create({ intermediates: true, idempotent: true })
  }
}

function buildDestinationPath(name: string) {
  const safeName = name.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `${DOCUMENTS_BASE_URI}${Date.now()}_${safeName || 'recipe.pdf'}`
}

export async function listRecipeDocuments(): Promise<RecipeDocument[]> {
  await ensureRecipeDocumentStorageReady()
  const rows = await getAllAsync<{
    id: string
    title: string | null
    file_name: string
    file_uri: string
    file_size: number
    created_at: string
  }>('SELECT * FROM recipe_documents ORDER BY created_at DESC;')
  return rows.map((row) => ({
    id: row.id as string,
    title: row.title ?? null,
    fileName: row.file_name as string,
    fileUri: row.file_uri as string,
    fileSize: Number(row.file_size),
    createdAt: row.created_at as string,
  }))
}

export async function getRecipeDocument(id: string): Promise<RecipeDocument | null> {
  await ensureRecipeDocumentStorageReady()
  const row = await getFirstAsync<{
    id: string
    title: string | null
    file_name: string
    file_uri: string
    file_size: number
    created_at: string
  }>('SELECT * FROM recipe_documents WHERE id = ?;', [id])
  if (!row) return null
  return {
    id: row.id as string,
    title: row.title ?? null,
    fileName: row.file_name as string,
    fileUri: row.file_uri as string,
    fileSize: Number(row.file_size),
    createdAt: row.created_at as string,
  }
}

export async function getRecipeDocumentUsageSummary(): Promise<RecipeDocumentUsageSummary> {
  await ensureRecipeDocumentStorageReady()
  const row = await getFirstAsync<{
    totalCount: number
    totalBytes: number
  }>(
    'SELECT COUNT(*) as totalCount, COALESCE(SUM(file_size), 0) as totalBytes FROM recipe_documents;'
  )
  return {
    totalCount: Number(row?.totalCount ?? 0),
    totalBytes: Number(row?.totalBytes ?? 0),
  }
}

export async function addRecipeDocument(input: {
  title?: string | null
  uri: string
  name: string
  size: number
}): Promise<RecipeDocument> {
  await ensureRecipeDocumentStorageReady()
  await ensureDir()

  const id = makeId()
  const createdAt = new Date().toISOString()
  const destination = buildDestinationPath(input.name)

  if (Platform.OS !== 'web') {
    const source = new File(input.uri)
    const target = new File(destination)
    source.copy(target)
  }

  const fileUri = Platform.OS === 'web' ? input.uri : destination
  const fileSize = input.size

  await runSqlAsync(
    `INSERT INTO recipe_documents
      (id, title, file_name, file_uri, file_size, created_at)
      VALUES (?, ?, ?, ?, ?, ?);`,
    [id, input.title ?? null, input.name, fileUri, fileSize, createdAt]
  )

  return {
    id,
    title: input.title ?? null,
    fileName: input.name,
    fileUri,
    fileSize,
    createdAt,
  }
}

export async function deleteRecipeDocument(id: string): Promise<void> {
  await ensureRecipeDocumentStorageReady()
  const row = await getFirstAsync<{ fileUri: string | null }>(
    'SELECT file_uri as fileUri FROM recipe_documents WHERE id = ?;',
    [id]
  )
  if (row?.fileUri && !row.fileUri.startsWith('http')) {
    try {
      const file = new File(row.fileUri)
      if (file.exists) {
        file.delete()
      }
    } catch {
      // ignore delete errors for stale files
    }
  }
  await runSqlAsync('DELETE FROM recipe_documents WHERE id = ?;', [id])
}
