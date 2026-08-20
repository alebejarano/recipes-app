import { Directory, File, Paths } from '@/lib/fileSystem'
import { Platform } from 'react-native'

import { ensureLocalSqliteMigrationReady } from '@/lib/localSqliteMigration'
import { getAllAsync, getFirstAsync, runSqlAsync, runSqlBatchAsync } from '@/lib/sqlite'
import { getActiveLocalDataOwner, getLocalDataOwnerFilter } from '@/features/storage/localDataScope'
import {
  FREE_PLAN_MAX_IMPORT_FILE_BYTES,
  FREE_PLAN_MAX_IMPORT_TOTAL_BYTES,
  IMPORT_FILE_TOO_LARGE_MESSAGE,
  PREMIUM_PLAN_MAX_STORAGE_BYTES,
} from '@/features/subscription/constants/limits'

export type ImportsUsageSummary = {
  totalCount: number
  totalBytes: number
}

export type ImportPlan = 'free' | 'premium'

type ImportKind = 'document' | 'image'

export type ManagedImport = {
  id: string
  documentId: string | null
  kind: ImportKind
  title: string | null
  fileName: string | null
  fileUri: string
  bytes: number
  createdAt: string
}

const IMPORT_IMAGES_DIR = new Directory(Paths.document, 'recipe-import-images')
const IMPORT_IMAGES_BASE_URI = IMPORT_IMAGES_DIR.uri.endsWith('/')
  ? IMPORT_IMAGES_DIR.uri
  : `${IMPORT_IMAGES_DIR.uri}/`

const MIGRATION_STATEMENTS = [
  {
    sql: `CREATE TABLE IF NOT EXISTS imports (
      id TEXT PRIMARY KEY NOT NULL,
      kind TEXT NOT NULL,
      file_name TEXT,
      file_uri TEXT NOT NULL,
      bytes INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      owner_user_id TEXT,
      deleted_at TEXT
    );`,
  },
  {
    sql: 'CREATE INDEX IF NOT EXISTS imports_deleted_at_idx ON imports(deleted_at);',
  },
  {
    sql: 'CREATE INDEX IF NOT EXISTS imports_kind_idx ON imports(kind);',
  },
  {
    sql: 'CREATE INDEX IF NOT EXISTS imports_file_uri_idx ON imports(file_uri);',
  },
]

let migrationsPromise: Promise<void> | null = null
let documentsBackfillPromise: Promise<void> | null = null

function makeId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

function nowIso() {
  return new Date().toISOString()
}

function buildImageDestinationPath(name: string) {
  const safeName = name.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `${IMPORT_IMAGES_BASE_URI}${Date.now()}_${safeName || 'recipe.jpg'}`
}

function isRemoteUri(uri: string) {
  return /^https?:\/\//i.test(uri)
}

async function ensureImageImportsDir() {
  if (Platform.OS === 'web') return
  if (!IMPORT_IMAGES_DIR.exists) {
    IMPORT_IMAGES_DIR.create({ intermediates: true, idempotent: true })
  }
}

export function ensureImportsStorageReady() {
  if (!migrationsPromise) {
    migrationsPromise = runSqlBatchAsync(MIGRATION_STATEMENTS).then(async () => {
      const columns = await getAllAsync<{ name: string }>('PRAGMA table_info(imports);')
      if (!columns.some((column) => column.name === 'owner_user_id')) {
        await runSqlAsync('ALTER TABLE imports ADD COLUMN owner_user_id TEXT;')
      }
    })
  }
  return migrationsPromise
}

async function backfillLegacyDocumentImports() {
  await ensureImportsStorageReady()
  try {
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
  } catch {
    // recipe_documents may not exist in fresh installs.
  }
}

async function ensureDocumentImportsBackfilled() {
  if (!documentsBackfillPromise) {
    documentsBackfillPromise = backfillLegacyDocumentImports()
  }
  await documentsBackfillPromise
}

export function isManagedLocalImportImageUri(uri: string | null | undefined) {
  if (!uri) return false
  return uri.startsWith(IMPORT_IMAGES_BASE_URI)
}

export async function getImportsUsageSummary(): Promise<ImportsUsageSummary> {
  await ensureImportsStorageReady()
  await ensureDocumentImportsBackfilled()
  const ownerFilter = getLocalDataOwnerFilter()
  const row = await getFirstAsync<{ totalCount: number; totalBytes: number }>(
    `SELECT COUNT(*) as totalCount, COALESCE(SUM(bytes), 0) as totalBytes
     FROM imports
     WHERE deleted_at IS NULL AND ${ownerFilter.sql};`,
    ownerFilter.params
  )
  return {
    totalCount: Number(row?.totalCount ?? 0),
    totalBytes: Number(row?.totalBytes ?? 0),
  }
}

export async function assertCanAddImport(params: {
  plan: ImportPlan
  incomingBytes: number
  replacingFileUri?: string | null
}) {
  const { plan, incomingBytes, replacingFileUri } = params

  if (!Number.isFinite(incomingBytes) || incomingBytes <= 0) {
    throw new Error('Invalid file size.')
  }

  if (incomingBytes > FREE_PLAN_MAX_IMPORT_FILE_BYTES) {
    throw new Error(IMPORT_FILE_TOO_LARGE_MESSAGE)
  }

  if (plan === 'free') {
    const usage = await getImportsUsageSummary()
    const replacingBytes = replacingFileUri
      ? await getActiveImportBytesByUri(replacingFileUri)
      : 0
    if (usage.totalBytes - replacingBytes + incomingBytes > FREE_PLAN_MAX_IMPORT_TOTAL_BYTES) {
      throw new Error('Import limit reached. Free plan allows 50 MB total.')
    }
  } else {
    const usage = await getImportsUsageSummary()
    const replacingBytes = replacingFileUri
      ? await getActiveImportBytesByUri(replacingFileUri)
      : 0
    if (usage.totalBytes - replacingBytes + incomingBytes > PREMIUM_PLAN_MAX_STORAGE_BYTES) {
      throw new Error('Storage limit reached. Premium includes up to 5 GB total.')
    }
  }
}

export async function resolveImportBytes(params: {
  incomingBytes: number | null | undefined
  fileUri: string
}): Promise<number> {
  const { incomingBytes, fileUri } = params
  if (Number.isFinite(incomingBytes) && Number(incomingBytes) > 0) {
    return Number(incomingBytes)
  }

  try {
    const info = await new File(fileUri).info()
    const fallbackSize =
      info.exists && 'size' in info && typeof info.size === 'number' ? info.size : 0
    if (Number.isFinite(fallbackSize) && fallbackSize > 0) {
      return fallbackSize
    }
  } catch {
    // fall through to strict reject below
  }

  throw new Error('Invalid file size.')
}

export async function registerImport(input: {
  kind: ImportKind
  fileName?: string | null
  fileUri: string
  bytes: number
  ownerUserId?: string | null
}) {
  await ensureImportsStorageReady()
  const ownerUserId = input.ownerUserId ?? getActiveLocalDataOwner()
  await runSqlAsync(
    `INSERT INTO imports (id, kind, file_name, file_uri, bytes, created_at, owner_user_id, deleted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, NULL);`,
    [makeId(), input.kind, input.fileName ?? null, input.fileUri, Math.max(0, input.bytes), nowIso(), ownerUserId]
  )
}

export async function markImportDeletedByUri(fileUri: string): Promise<void> {
  await ensureImportsStorageReady()
  await runSqlAsync(
    `UPDATE imports
     SET deleted_at = ?
     WHERE file_uri = ? AND deleted_at IS NULL;`,
    [nowIso(), fileUri]
  )
}

export async function getActiveImportBytesByUri(fileUri: string): Promise<number> {
  await ensureImportsStorageReady()
  const ownerFilter = getLocalDataOwnerFilter()
  const row = await getFirstAsync<{ bytes: number | null }>(
    `SELECT bytes
     FROM imports
     WHERE file_uri = ? AND deleted_at IS NULL AND ${ownerFilter.sql}
     ORDER BY created_at DESC
     LIMIT 1;`,
    [fileUri, ...ownerFilter.params]
  )
  return Number(row?.bytes ?? 0)
}

export async function listManagedImports(): Promise<ManagedImport[]> {
  await ensureImportsStorageReady()
  await ensureDocumentImportsBackfilled()
  const ownerFilter = getLocalDataOwnerFilter('i.owner_user_id')
  let rows: {
    id: string
    document_id: string | null
    kind: ImportKind
    title: string | null
    file_name: string | null
    file_uri: string
    bytes: number
    created_at: string
  }[] = []

  try {
    rows = await getAllAsync<{
      id: string
      document_id: string | null
      kind: ImportKind
      title: string | null
      file_name: string | null
      file_uri: string
      bytes: number
      created_at: string
    }>(
      `SELECT i.id, rd.id as document_id, i.kind, rd.title as title, i.file_name, i.file_uri, i.bytes, i.created_at
       FROM imports i
       LEFT JOIN recipe_documents rd ON rd.file_uri = i.file_uri
       WHERE i.deleted_at IS NULL AND ${ownerFilter.sql}
       ORDER BY i.created_at DESC;`,
      ownerFilter.params
    )
  } catch {
    rows = await getAllAsync<{
      id: string
      document_id: string | null
      kind: ImportKind
      title: string | null
      file_name: string | null
      file_uri: string
      bytes: number
      created_at: string
    }>(
      `SELECT id, NULL as document_id, kind, NULL as title, file_name, file_uri, bytes, created_at
       FROM imports
       WHERE deleted_at IS NULL AND ${getLocalDataOwnerFilter().sql}
       ORDER BY created_at DESC;`,
      getLocalDataOwnerFilter().params
    )
  }

  return rows.map((row) => ({
    id: row.id,
    documentId: row.document_id ?? null,
    kind: row.kind,
    title: row.title ?? null,
    fileName: row.file_name ?? null,
    fileUri: row.file_uri,
    bytes: Number(row.bytes ?? 0),
    createdAt: row.created_at,
  }))
}

export async function deleteManagedImport(importId: string): Promise<void> {
  await ensureImportsStorageReady()
  const row = await getFirstAsync<{ kind: ImportKind; fileUri: string | null }>(
    `SELECT kind, file_uri as fileUri
     FROM imports
     WHERE id = ? AND deleted_at IS NULL
     LIMIT 1;`,
    [importId]
  )

  const fileUri = row?.fileUri?.trim() ?? ''
  if (!fileUri) return

  if (row?.kind === 'document') {
    try {
      await runSqlAsync('DELETE FROM recipe_documents WHERE file_uri = ?;', [fileUri])
    } catch {
      // recipe_documents may not exist yet in fresh installs.
    }
  } else if (row?.kind === 'image') {
    await ensureLocalSqliteMigrationReady()
    const now = nowIso()
    await runSqlAsync(
      `UPDATE local_recipes
       SET image_url = NULL, updated_at = ?, dirty = 1, version = version + 1
       WHERE image_url = ? AND deleted_at IS NULL;`,
      [now, fileUri]
    )
  }

  await removeImportByUri(fileUri)
}

export async function importLocalImage(input: {
  plan?: ImportPlan
  uri: string
  name: string
  size: number
  replacingFileUri?: string | null
}): Promise<{ uri: string; size: number }> {
  await ensureImportsStorageReady()
  await ensureImageImportsDir()
  const resolvedSize = await resolveImportBytes({
    incomingBytes: input.size,
    fileUri: input.uri,
  })
  await assertCanAddImport({
    plan: input.plan ?? 'free',
    incomingBytes: resolvedSize,
    replacingFileUri: input.replacingFileUri ?? null,
  })

  const destination = Platform.OS === 'web' ? input.uri : buildImageDestinationPath(input.name)
  if (Platform.OS !== 'web') {
    const source = new File(input.uri)
    const target = new File(destination)
    source.copy(target)
  }

  await registerImport({
    kind: 'image',
    fileName: input.name,
    fileUri: destination,
    bytes: resolvedSize,
  })

  return {
    uri: destination,
    size: resolvedSize,
  }
}

export async function removeImportByUri(fileUri: string): Promise<void> {
  await ensureImportsStorageReady()
  if (fileUri && !isRemoteUri(fileUri)) {
    try {
      const file = new File(fileUri)
      if (file.exists) {
        file.delete()
      }
    } catch {
      // ignore missing or stale local files
    }
  }
  await markImportDeletedByUri(fileUri)
}
