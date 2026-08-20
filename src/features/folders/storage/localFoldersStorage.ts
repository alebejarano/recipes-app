import type { Folder } from '@/features/folders/api/foldersCloudRepo'
import { renameFolderInLocalRecipesByName } from '@/features/recipes/storage/localRecipesStorage'
import { ensureLocalSqliteMigrationReady } from '@/lib/localSqliteMigration'
import { getAllAsync, getFirstAsync, runSqlAsync } from '@/lib/sqlite'
import { getActiveLocalDataOwner, getLocalDataOwnerFilter } from '@/features/storage/localDataScope'

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

export type LocalFolderSyncRow = {
  id: string
  ownerUserId: string | null
  cloudId: string | null
  name: string
  emoji: string | null
  deletedAt: string | null
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
  const ownerFilter = getLocalDataOwnerFilter()
  if (search) {
    return getAllAsync<LocalFolderRow>(
      `SELECT * FROM local_folders
       WHERE deleted_at IS NULL
         AND ${ownerFilter.sql}
         AND name LIKE ? COLLATE NOCASE
       ORDER BY name ASC
       LIMIT ?;`,
      [...ownerFilter.params, `%${search}%`, limit]
    )
  }
  return getAllAsync<LocalFolderRow>(
    `SELECT * FROM local_folders WHERE deleted_at IS NULL AND ${ownerFilter.sql} ORDER BY name ASC LIMIT ?;`,
    [...ownerFilter.params, limit]
  )
}

async function getById(id: string, includeDeleted = false): Promise<LocalFolderRow | null> {
  await ensureLocalSqliteMigrationReady()
  const deletedFilter = includeDeleted ? '' : ' AND deleted_at IS NULL'
  const ownerFilter = getLocalDataOwnerFilter()
  return getFirstAsync<LocalFolderRow>(
    `SELECT * FROM local_folders WHERE id = ?${deletedFilter} AND ${ownerFilter.sql} LIMIT 1;`,
    [id, ...ownerFilter.params]
  )
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
    owner_user_id: getActiveLocalDataOwner(),
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

  if (existing.name.trim().toLowerCase() !== input.name.trim().toLowerCase()) {
    await renameFolderInLocalRecipesByName({
      fromName: existing.name,
      toName: input.name.trim(),
      emoji: input.emoji ?? existing.emoji ?? '📁',
    })
  }

  const next = await getById(input.id)
  if (!next) throw new Error('Folder not found')

  return toFolderView(next)
}

export async function deleteLocalFolder(id: string): Promise<void> {
  await ensureLocalSqliteMigrationReady()
  const existing = await getById(id, true)
  if (!existing) return

  const shouldSoftDeleteForSync = Boolean(existing.cloud_id || existing.owner_user_id)
  if (shouldSoftDeleteForSync) {
    const now = new Date().toISOString()
    await runSqlAsync(
      `UPDATE local_folders
        SET deleted_at = ?, updated_at = ?, dirty = ?, version = ?
        WHERE id = ?;`,
      [now, now, 1, (existing.version ?? 1) + 1, id]
    )
    return
  }

  await runSqlAsync('DELETE FROM local_folders WHERE id = ?;', [id])
}

function toSyncRow(row: LocalFolderRow): LocalFolderSyncRow {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id ?? null,
    cloudId: row.cloud_id ?? null,
    name: row.name,
    emoji: row.emoji ?? null,
    deletedAt: row.deleted_at ?? null,
  }
}

export async function listDirtyLocalFolderRowsForSync(limit = 100): Promise<LocalFolderSyncRow[]> {
  await ensureLocalSqliteMigrationReady()
  const rows = await getAllAsync<LocalFolderRow>(
    `SELECT * FROM local_folders
      WHERE dirty = 1
      ORDER BY updated_at ASC
      LIMIT ?;`,
    [limit]
  )
  return rows.map(toSyncRow)
}

export async function markLocalFolderSynced(params: {
  localId: string
  ownerUserId: string
  cloudId: string
}) {
  await ensureLocalSqliteMigrationReady()
  const now = new Date().toISOString()
  await runSqlAsync(
    `UPDATE local_folders
      SET owner_user_id = ?, cloud_id = ?, dirty = ?, deleted_at = ?, last_synced_at = ?, updated_at = ?
      WHERE id = ?;`,
    [params.ownerUserId, params.cloudId, 0, null, now, now, params.localId]
  )
}

export async function mergeCloudFoldersIntoLocal(params: {
  ownerUserId: string
  cloudFolders: Folder[]
}) {
  await ensureLocalSqliteMigrationReady()

  const ownerUserId = params.ownerUserId.trim()
  if (!ownerUserId) return

  const cloudFolders = params.cloudFolders
  const now = new Date().toISOString()
  const cloudIds = new Set(cloudFolders.map((folder) => folder.id))
  const existingRows = await getAllAsync<LocalFolderRow>(
    'SELECT * FROM local_folders WHERE owner_user_id = ? OR owner_user_id IS NULL;',
    [ownerUserId]
  )

  const byCloudId = new Map<string, LocalFolderRow>()
  for (const row of existingRows) {
    if (row.cloud_id) {
      byCloudId.set(row.cloud_id, row)
    }
  }

  for (const cloudFolder of cloudFolders) {
    const existing = byCloudId.get(cloudFolder.id)
    if (existing) {
      if (existing.dirty === 1) continue

      await runSqlAsync(
        `UPDATE local_folders
          SET
            name = ?,
            emoji = ?,
            updated_at = ?,
            deleted_at = ?,
            owner_user_id = ?,
            cloud_id = ?,
            dirty = ?,
            last_synced_at = ?
          WHERE id = ?;`,
        [
          cloudFolder.name,
          cloudFolder.emoji ?? null,
          now,
          null,
          ownerUserId,
          cloudFolder.id,
          0,
          now,
          existing.id,
        ]
      )
      continue
    }

    const localId = `cloud_${cloudFolder.id}`
    await runSqlAsync(
      `INSERT INTO local_folders
        (
          id, name, emoji, created_at, updated_at, deleted_at,
          owner_user_id, cloud_id, dirty, version, last_synced_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          emoji = excluded.emoji,
          created_at = excluded.created_at,
          updated_at = excluded.updated_at,
          deleted_at = excluded.deleted_at,
          owner_user_id = excluded.owner_user_id,
          cloud_id = excluded.cloud_id,
          dirty = excluded.dirty,
          last_synced_at = excluded.last_synced_at
        WHERE local_folders.dirty IS NULL OR local_folders.dirty != 1;`,
      [
        localId,
        cloudFolder.name,
        cloudFolder.emoji ?? null,
        cloudFolder.createdAt ?? now,
        cloudFolder.createdAt ?? now,
        null,
        ownerUserId,
        cloudFolder.id,
        0,
        1,
        now,
      ]
    )
  }

  for (const existing of existingRows) {
    if (!existing.cloud_id) continue
    if (existing.dirty === 1) continue
    if (!cloudIds.has(existing.cloud_id)) {
      await runSqlAsync('DELETE FROM local_folders WHERE id = ?;', [existing.id])
    }
  }
}

export async function purgeLocalFolderRow(localId: string) {
  await ensureLocalSqliteMigrationReady()
  await runSqlAsync('DELETE FROM local_folders WHERE id = ?;', [localId])
}
