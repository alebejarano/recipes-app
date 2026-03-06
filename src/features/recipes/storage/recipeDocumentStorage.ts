import { Directory, File, Paths } from 'expo-file-system'
import { Platform } from 'react-native'

import { getAllAsync, getFirstAsync, runSqlAsync, runSqlBatchAsync } from '@/lib/sqlite'
import {
  assertCanAddImport,
  ensureImportsStorageReady,
  getImportsUsageSummary,
  type ImportPlan,
  registerImport,
  resolveImportBytes,
  removeImportByUri,
} from '@/features/recipes/storage/importsStorage'

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

export type DuplicateRecipeDocument = {
  id: string
  title: string | null
  createdAt: string
}

export const DUPLICATE_RECIPE_DOCUMENT_CODE = 'duplicate_import'

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
let importsBackfillPromise: Promise<void> | null = null

export function ensureRecipeDocumentStorageReady() {
  if (!migrationsPromise) {
    migrationsPromise = runSqlBatchAsync(MIGRATION_STATEMENTS)
  }
  return migrationsPromise
}

async function backfillLegacyDocumentImports() {
  await ensureRecipeDocumentStorageReady()
  await ensureImportsStorageReady()
  await runSqlAsync(
    `INSERT INTO imports (id, kind, file_name, file_uri, bytes, created_at, deleted_at)
     SELECT lower(hex(randomblob(16))), 'document', rd.file_name, rd.file_uri, rd.file_size, rd.created_at, NULL
     FROM recipe_documents rd
     WHERE NOT EXISTS (
       SELECT 1
       FROM imports i
       WHERE i.kind = 'document' AND i.file_uri = rd.file_uri AND i.deleted_at IS NULL
     );`
  )
}

async function ensureDocumentImportsBackfilled() {
  if (!importsBackfillPromise) {
    importsBackfillPromise = backfillLegacyDocumentImports()
  }
  await importsBackfillPromise
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

async function resolveFileFingerprint(uri: string): Promise<string | null> {
  try {
    const info = await new File(uri).info({ md5: true })
    const md5 = typeof info.md5 === 'string' ? info.md5.trim().toLowerCase() : ''
    return md5 || null
  } catch {
    return null
  }
}

export async function findDuplicateRecipeDocumentByFile(input: {
  uri: string
}): Promise<DuplicateRecipeDocument | null> {
  await ensureRecipeDocumentStorageReady()
  const fingerprint = await resolveFileFingerprint(input.uri)
  if (!fingerprint) return null
  const rows = await getAllAsync<{
    id: string
    title: string | null
    file_uri: string
    created_at: string
  }>('SELECT id, title, file_uri, created_at FROM recipe_documents ORDER BY created_at DESC;')

  for (const row of rows) {
    const existingFingerprint = await resolveFileFingerprint(row.file_uri)
    if (!existingFingerprint) continue
    if (existingFingerprint !== fingerprint) continue
    return {
      id: row.id,
      title: row.title ?? null,
      createdAt: row.created_at,
    }
  }
  return null
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
  await ensureDocumentImportsBackfilled()
  return getImportsUsageSummary()
}

export async function assertCanAddRecipeDocument(params: {
  plan: ImportPlan
  incomingBytes: number
}) {
  await ensureDocumentImportsBackfilled()
  await assertCanAddImport({
    plan: params.plan,
    incomingBytes: params.incomingBytes,
  })
}

export async function addRecipeDocument(input: {
  title?: string | null
  uri: string
  name: string
  size: number
  plan?: ImportPlan
}): Promise<RecipeDocument> {
  await ensureRecipeDocumentStorageReady()
  await ensureDocumentImportsBackfilled()
  const resolvedSize = await resolveImportBytes({
    incomingBytes: input.size,
    fileUri: input.uri,
  })
  await assertCanAddRecipeDocument({
    plan: input.plan ?? 'free',
    incomingBytes: resolvedSize,
  })

  const existing = await findDuplicateRecipeDocumentByFile({ uri: input.uri })
  if (existing) {
    const duplicateError = new Error('This file has already been imported.')
    ;(duplicateError as Error & { code?: string }).code = DUPLICATE_RECIPE_DOCUMENT_CODE
    throw duplicateError
  }

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
  const fileSize = resolvedSize

  await runSqlAsync(
    `INSERT INTO recipe_documents
      (id, title, file_name, file_uri, file_size, created_at)
      VALUES (?, ?, ?, ?, ?, ?);`,
    [id, input.title ?? null, input.name, fileUri, fileSize, createdAt]
  )
  await registerImport({
    kind: 'document',
    fileName: input.name,
    fileUri,
    bytes: fileSize,
  })

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
  if (row?.fileUri) {
    await removeImportByUri(row.fileUri)
  }
  await runSqlAsync('DELETE FROM recipe_documents WHERE id = ?;', [id])
}
