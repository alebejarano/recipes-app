import { Directory, File, Paths } from '@/lib/fileSystem'
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
import { getActiveLocalDataOwner, getLocalDataOwnerFilter } from '@/features/storage/localDataScope'

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

export type LocalRecipeDocumentSyncRow = {
  id: string
  title: string | null
  fileName: string
  fileUri: string
  fileSize: number
  createdAt: string
  ownerUserId: string | null
  cloudId: string | null
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
      created_at TEXT NOT NULL,
      owner_user_id TEXT,
      cloud_id TEXT,
      dirty INTEGER,
      last_synced_at TEXT
    );`,
  },
  {
    sql: 'CREATE INDEX IF NOT EXISTS recipe_documents_created_at_idx ON recipe_documents(created_at);',
  },
]

let migrationsPromise: Promise<void> | null = null
let importsBackfillPromise: Promise<void> | null = null
let orphanCleanupPromise: Promise<void> | null = null

export function ensureRecipeDocumentStorageReady() {
  if (!migrationsPromise) {
    migrationsPromise = runSqlBatchAsync(MIGRATION_STATEMENTS).then(async () => {
      const columns = await getAllAsync<{ name: string }>('PRAGMA table_info(recipe_documents);')
      const names = new Set(columns.map((column) => column.name))
      if (!names.has('owner_user_id')) {
        await runSqlAsync('ALTER TABLE recipe_documents ADD COLUMN owner_user_id TEXT;')
      }
      if (!names.has('cloud_id')) {
        await runSqlAsync('ALTER TABLE recipe_documents ADD COLUMN cloud_id TEXT;')
      }
      if (!names.has('dirty')) {
        await runSqlAsync('ALTER TABLE recipe_documents ADD COLUMN dirty INTEGER;')
      }
      if (!names.has('last_synced_at')) {
        await runSqlAsync('ALTER TABLE recipe_documents ADD COLUMN last_synced_at TEXT;')
      }
    })
  }
  return migrationsPromise
}

async function backfillLegacyDocumentImports() {
  await ensureRecipeDocumentStorageReady()
  await ensureImportsStorageReady()
  await runSqlAsync(
    `INSERT INTO imports (id, kind, file_name, file_uri, bytes, created_at, owner_user_id, deleted_at)
     SELECT lower(hex(randomblob(16))), 'document', rd.file_name, rd.file_uri, rd.file_size, rd.created_at, rd.owner_user_id, NULL
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

async function purgeOrphanedLocalRecipeDocuments() {
  if (Platform.OS === 'web') return

  await ensureRecipeDocumentStorageReady()
  const rows = await getAllAsync<{
    id: string
    file_uri: string
  }>('SELECT id, file_uri FROM recipe_documents;')

  for (const row of rows) {
    const fileUri = row.file_uri?.trim() ?? ''
    if (!fileUri) {
      await runSqlAsync('DELETE FROM recipe_documents WHERE id = ?;', [row.id])
      continue
    }

    try {
      const file = new File(fileUri)
      if (file.exists) continue
    } catch {
      // Treat unreadable entries as stale local records.
    }

    await runSqlAsync('DELETE FROM recipe_documents WHERE id = ?;', [row.id])
    await runSqlAsync(
      `UPDATE imports
       SET deleted_at = COALESCE(deleted_at, ?)
       WHERE kind = 'document' AND file_uri = ? AND deleted_at IS NULL;`,
      [new Date().toISOString(), fileUri]
    )
  }
}

export async function ensureLocalRecipeDocumentCleanup() {
  if (!orphanCleanupPromise) {
    orphanCleanupPromise = purgeOrphanedLocalRecipeDocuments().catch((error) => {
      orphanCleanupPromise = null
      throw error
    })
  }
  await orphanCleanupPromise
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
  await ensureLocalRecipeDocumentCleanup()
  const fingerprint = await resolveFileFingerprint(input.uri)
  if (!fingerprint) return null
  const rows = await getAllAsync<{
    id: string
    title: string | null
    file_uri: string
    created_at: string
  }>(
    `SELECT id, title, file_uri, created_at
     FROM recipe_documents
     WHERE ${getLocalDataOwnerFilter().sql}
     ORDER BY created_at DESC;`,
    getLocalDataOwnerFilter().params
  )

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
  await ensureLocalRecipeDocumentCleanup()
  const ownerFilter = getLocalDataOwnerFilter()
  const rows = await getAllAsync<{
    id: string
    title: string | null
    file_name: string
    file_uri: string
    file_size: number
    created_at: string
  }>(
    `SELECT * FROM recipe_documents WHERE ${ownerFilter.sql} ORDER BY created_at DESC;`,
    ownerFilter.params
  )
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
  await ensureLocalRecipeDocumentCleanup()
  const ownerFilter = getLocalDataOwnerFilter()
  const row = await getFirstAsync<{
    id: string
    title: string | null
    file_name: string
    file_uri: string
    file_size: number
    created_at: string
  }>(`SELECT * FROM recipe_documents WHERE id = ? AND ${ownerFilter.sql};`, [id, ...ownerFilter.params])
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

export async function updateRecipeDocumentTitle(input: {
  id: string
  title: string
}): Promise<void> {
  await ensureRecipeDocumentStorageReady()
  const title = input.title.trim()
  if (!title) throw new Error('Import name is required.')
  if (title.length > 120) throw new Error('Import name must be 120 characters or fewer.')

  const ownerFilter = getLocalDataOwnerFilter()
  await runSqlAsync(
    `UPDATE recipe_documents
     SET title = ?
     WHERE id = ? AND ${ownerFilter.sql};`,
    [title, input.id, ...ownerFilter.params]
  )
}

export async function getRecipeDocumentUsageSummary(): Promise<RecipeDocumentUsageSummary> {
  await ensureLocalRecipeDocumentCleanup()
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
  ownerUserId?: string | null
  cloudId?: string | null
  synced?: boolean
}): Promise<RecipeDocument> {
  await ensureRecipeDocumentStorageReady()
  await ensureLocalRecipeDocumentCleanup()
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

  const ownerUserId = input.ownerUserId ?? getActiveLocalDataOwner()

  await runSqlAsync(
    `INSERT INTO recipe_documents
      (id, title, file_name, file_uri, file_size, created_at, owner_user_id, cloud_id, dirty, last_synced_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      id,
      input.title ?? null,
      input.name,
      fileUri,
      fileSize,
      createdAt,
      ownerUserId,
      input.cloudId ?? null,
      input.synced ? 0 : 1,
      input.synced ? createdAt : null,
    ]
  )
  await registerImport({
    kind: 'document',
    fileName: input.name,
    fileUri,
    bytes: fileSize,
    ownerUserId,
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

export async function listDirtyLocalRecipeDocumentRowsForSync(): Promise<LocalRecipeDocumentSyncRow[]> {
  await ensureRecipeDocumentStorageReady()
  await ensureLocalRecipeDocumentCleanup()
  const rows = await getAllAsync<{
    id: string
    title: string | null
    file_name: string
    file_uri: string
    file_size: number
    created_at: string
    owner_user_id: string | null
    cloud_id: string | null
  }>(
    `SELECT id, title, file_name, file_uri, file_size, created_at, owner_user_id, cloud_id
     FROM recipe_documents
     WHERE COALESCE(dirty, 1) = 1
     ORDER BY created_at ASC;`
  )
  return rows.map((row) => ({
    id: row.id,
    title: row.title ?? null,
    fileName: row.file_name,
    fileUri: row.file_uri,
    fileSize: Number(row.file_size),
    createdAt: row.created_at,
    ownerUserId: row.owner_user_id ?? null,
    cloudId: row.cloud_id ?? null,
  }))
}

/**
 * Premium screens may show only this account's locally queued uploads beside
 * cloud imports. Synced cache rows are intentionally excluded: cloud remains
 * the source of truth whenever it is reachable.
 */
export async function listPendingLocalRecipeDocuments(): Promise<RecipeDocument[]> {
  await ensureRecipeDocumentStorageReady()
  await ensureLocalRecipeDocumentCleanup()
  const ownerFilter = getLocalDataOwnerFilter()
  const rows = await getAllAsync<{
    id: string
    title: string | null
    file_name: string
    file_uri: string
    file_size: number
    created_at: string
  }>(
    `SELECT id, title, file_name, file_uri, file_size, created_at
     FROM recipe_documents
     WHERE COALESCE(dirty, 1) = 1 AND ${ownerFilter.sql}
     ORDER BY created_at DESC;`,
    ownerFilter.params
  )
  return rows.map((row) => ({
    id: row.id,
    title: row.title ?? null,
    fileName: row.file_name,
    fileUri: row.file_uri,
    fileSize: Number(row.file_size),
    createdAt: row.created_at,
  }))
}

export async function markLocalRecipeDocumentSynced(input: {
  localId: string
  ownerUserId: string
  cloudId: string
}) {
  await ensureRecipeDocumentStorageReady()
  await runSqlAsync(
    `UPDATE recipe_documents
     SET owner_user_id = ?, cloud_id = ?, dirty = 0, last_synced_at = ?
     WHERE id = ?;`,
    [input.ownerUserId, input.cloudId, new Date().toISOString(), input.localId]
  )
}

export async function deleteRecipeDocument(id: string): Promise<void> {
  await ensureRecipeDocumentStorageReady()
  await ensureLocalRecipeDocumentCleanup()
  const ownerFilter = getLocalDataOwnerFilter()
  const row = await getFirstAsync<{ fileUri: string | null }>(
    `SELECT file_uri as fileUri FROM recipe_documents WHERE id = ? AND ${ownerFilter.sql};`,
    [id, ...ownerFilter.params]
  )
  if (row?.fileUri) {
    await removeImportByUri(row.fileUri)
  }
  await runSqlAsync(
    `DELETE FROM recipe_documents WHERE id = ? AND ${ownerFilter.sql};`,
    [id, ...ownerFilter.params]
  )
}
