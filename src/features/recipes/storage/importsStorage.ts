import { Directory, File, Paths } from 'expo-file-system'
import { Platform } from 'react-native'

import { getFirstAsync, runSqlAsync, runSqlBatchAsync } from '@/lib/sqlite'
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
    migrationsPromise = runSqlBatchAsync(MIGRATION_STATEMENTS)
  }
  return migrationsPromise
}

export function isManagedLocalImportImageUri(uri: string | null | undefined) {
  if (!uri) return false
  return uri.startsWith(IMPORT_IMAGES_BASE_URI)
}

export async function getImportsUsageSummary(): Promise<ImportsUsageSummary> {
  await ensureImportsStorageReady()
  const row = await getFirstAsync<{ totalCount: number; totalBytes: number }>(
    `SELECT COUNT(*) as totalCount, COALESCE(SUM(bytes), 0) as totalBytes
     FROM imports
     WHERE deleted_at IS NULL;`
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
}) {
  await ensureImportsStorageReady()
  await runSqlAsync(
    `INSERT INTO imports (id, kind, file_name, file_uri, bytes, created_at, deleted_at)
     VALUES (?, ?, ?, ?, ?, ?, NULL);`,
    [makeId(), input.kind, input.fileName ?? null, input.fileUri, Math.max(0, input.bytes), nowIso()]
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
  const row = await getFirstAsync<{ bytes: number | null }>(
    `SELECT bytes
     FROM imports
     WHERE file_uri = ? AND deleted_at IS NULL
     ORDER BY created_at DESC
     LIMIT 1;`,
    [fileUri]
  )
  return Number(row?.bytes ?? 0)
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
