import { ensureLocalSqliteMigrationReady } from '@/lib/localSqliteMigration'
import { getAllAsync, getFirstAsync, runSqlAsync } from '@/lib/sqlite'

type LocalFolderRow = {
  id: string
  name: string
  emoji: string | null
  created_at: string
  updated_at: string
  deleted_at?: string | null
  owner_user_id?: string | null
  cloud_id?: string | null
  dirty?: number
  version?: number
  last_synced_at?: string | null
}

export type LocalFolder = {
  id: string
  name: string
  emoji: string | null
  createdAt: string
  updatedAt: string
}

type LocalFoldersListParams = {
  limit?: number
  search?: string
}

function makeId() {
  const randomUuid = globalThis.crypto?.randomUUID?.()
  if (randomUuid) return randomUuid
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

async function readAll(params?: LocalFoldersListParams): Promise<LocalFolderRow[]> {
  await ensureLocalSqliteMigrationReady()
  const limit = params?.limit ?? 200
  const search = params?.search?.trim()
  if (search) {
    return getAllAsync<LocalFolderRow>(
      `SELECT * FROM local_folders
       WHERE name LIKE ? COLLATE NOCASE
       ORDER BY name ASC
       LIMIT ?;`,
      [`%${search}%`, limit]
    )
  }
  return getAllAsync<LocalFolderRow>('SELECT * FROM local_folders ORDER BY name ASC LIMIT ?;', [limit])
}

async function getById(id: string): Promise<LocalFolderRow | null> {
  await ensureLocalSqliteMigrationReady()
  return getFirstAsync<LocalFolderRow>('SELECT * FROM local_folders WHERE id = ? LIMIT 1;', [id])
}

function toFolderView(row: LocalFolderRow): LocalFolder {
  const legacyCreatedAt =
    typeof (row as any).createdAt === 'string' ? ((row as any).createdAt as string) : null
  const legacyUpdatedAt =
    typeof (row as any).updatedAt === 'string' ? ((row as any).updatedAt as string) : null

  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji ?? null,
    createdAt: row.created_at ?? legacyCreatedAt ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? legacyUpdatedAt ?? new Date().toISOString(),
  }
}

export async function listLocalFolders(params?: LocalFoldersListParams): Promise<LocalFolder[]> {
  const rows = await readAll(params)
  return rows.map(toFolderView)
}

export async function getLocalFolder(id: string): Promise<LocalFolder | null> {
  const row = await getById(id)
  return row ? toFolderView(row) : null
}

export async function createLocalFolder(input: {
  name: string
  emoji?: string | null
}): Promise<LocalFolder> {
  await ensureLocalSqliteMigrationReady()
  const now = new Date().toISOString()
  const row: LocalFolderRow = {
    id: makeId(),
    name: input.name.trim(),
    emoji: input.emoji ?? null,
    created_at: now,
    updated_at: now,
    deleted_at: null,
    dirty: 1,
    version: 1,
    last_synced_at: null,
  }

  await runSqlAsync(
    `INSERT INTO local_folders
      (
        id, name, emoji, created_at, updated_at, deleted_at,
        owner_user_id, cloud_id, dirty, version, last_synced_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      row.id,
      row.name,
      row.emoji ?? null,
      row.created_at,
      row.updated_at,
      row.deleted_at ?? null,
      row.owner_user_id ?? null,
      row.cloud_id ?? null,
      row.dirty ?? 1,
      row.version ?? 1,
      row.last_synced_at ?? null,
    ]
  )

  return toFolderView(row)
}

export async function updateLocalFolder(input: {
  id: string
  name: string
  emoji?: string | null
}): Promise<LocalFolder> {
  await ensureLocalSqliteMigrationReady()

  const existing = await getById(input.id)
  if (!existing) throw new Error('Folder not found')

  const updatedAt = new Date().toISOString()
  const nextVersion = (existing.version ?? 1) + 1

  await runSqlAsync(
    `UPDATE local_folders
      SET name = ?, emoji = ?, updated_at = ?, dirty = ?, version = ?
      WHERE id = ?;`,
    [input.name.trim(), input.emoji ?? null, updatedAt, 1, nextVersion, input.id]
  )

  const next = await getById(input.id)
  if (!next) throw new Error('Folder not found')

  return toFolderView(next)
}

export async function deleteLocalFolder(id: string): Promise<void> {
  await ensureLocalSqliteMigrationReady()
  await runSqlAsync('DELETE FROM local_folders WHERE id = ?;', [id])
}
