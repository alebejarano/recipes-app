import { ensureLocalSqliteMigrationReady } from '@/lib/localSqliteMigration'
import { getAllAsync, getFirstAsync, runSqlAsync } from '@/lib/sqlite'
import type { Note } from '@/features/notes/api/notesRepo'

type LocalNoteRow = {
  id: string
  title: string | null
  content: string | null
  pinned_at: string | null
  created_at: string
  updated_at: string
  deleted_at?: string | null
  owner_user_id?: string | null
  cloud_id?: string | null
  dirty?: number
  version?: number
  last_synced_at?: string | null
}

export type LocalNoteSyncRow = {
  id: string
  ownerUserId: string | null
  cloudId: string | null
  title: string | null
  content: string | null
  pinnedAt: string | null
  deletedAt: string | null
}

export type LocalNote = {
  id: string
  title: string | null
  content: string | null
  pinnedAt: string | null
  createdAt: string
  updatedAt: string
}

type LocalNotesListParams = {
  limit?: number
  search?: string
}

function makeId() {
  const randomUuid = globalThis.crypto?.randomUUID?.()
  if (randomUuid) return randomUuid
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

async function listNoteRows(params?: LocalNotesListParams): Promise<LocalNoteRow[]> {
  await ensureLocalSqliteMigrationReady()
  const limit = params?.limit ?? 200
  const search = params?.search?.trim()
  if (search) {
    return getAllAsync<LocalNoteRow>(
      `SELECT * FROM local_notes
       WHERE deleted_at IS NULL
         AND (
           title LIKE ? COLLATE NOCASE
           OR content LIKE ? COLLATE NOCASE
         )
       ORDER BY (pinned_at IS NOT NULL) DESC, pinned_at DESC, updated_at DESC
       LIMIT ?;`,
      [`%${search}%`, `%${search}%`, limit]
    )
  }
  return getAllAsync<LocalNoteRow>(
    'SELECT * FROM local_notes WHERE deleted_at IS NULL ORDER BY (pinned_at IS NOT NULL) DESC, pinned_at DESC, updated_at DESC LIMIT ?;',
    [limit]
  )
}

async function getNoteRow(id: string, includeDeleted = false): Promise<LocalNoteRow | null> {
  await ensureLocalSqliteMigrationReady()
  const deletedFilter = includeDeleted ? '' : ' AND deleted_at IS NULL'
  return getFirstAsync<LocalNoteRow>(
    `SELECT * FROM local_notes WHERE id = ?${deletedFilter} LIMIT 1;`,
    [id]
  )
}

function normalizeText(value: string): string | null {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function toNoteView(row: LocalNoteRow): LocalNote {
  const legacyCreatedAt =
    typeof (row as any).createdAt === 'string' ? ((row as any).createdAt as string) : null
  const legacyUpdatedAt =
    typeof (row as any).updatedAt === 'string' ? ((row as any).updatedAt as string) : null

  return {
    id: row.id,
    title: row.title ?? null,
    content: row.content ?? null,
    pinnedAt: row.pinned_at ?? null,
    createdAt: row.created_at ?? legacyCreatedAt ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? legacyUpdatedAt ?? new Date().toISOString(),
  }
}

export async function listLocalNotes(params?: LocalNotesListParams): Promise<LocalNote[]> {
  const rows = await listNoteRows(params)
  return rows.map(toNoteView)
}

export async function getLocalNote(id: string): Promise<LocalNote | null> {
  const row = await getNoteRow(id)
  return row ? toNoteView(row) : null
}

export async function createLocalNote(input: {
  title: string
  content: string
  pinnedAt?: string | null
}): Promise<LocalNote> {
  await ensureLocalSqliteMigrationReady()
  const now = new Date().toISOString()
  const note: LocalNoteRow = {
    id: makeId(),
    title: normalizeText(input.title),
    content: normalizeText(input.content),
    pinned_at: input.pinnedAt ?? null,
    created_at: now,
    updated_at: now,
    deleted_at: null,
    dirty: 1,
    version: 1,
    last_synced_at: null,
  }

  await runSqlAsync(
    `INSERT INTO local_notes
      (
        id, title, content, created_at, updated_at, deleted_at,
        owner_user_id, cloud_id, dirty, version, last_synced_at, pinned_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      note.id,
      note.title,
      note.content,
      note.created_at,
      note.updated_at,
      note.deleted_at ?? null,
      note.owner_user_id ?? null,
      note.cloud_id ?? null,
      note.dirty ?? 1,
      note.version ?? 1,
      note.last_synced_at ?? null,
      note.pinned_at ?? null,
    ]
  )

  return toNoteView(note)
}

export async function updateLocalNote(
  id: string,
  input: { title?: string; content?: string; pinnedAt?: string | null }
): Promise<LocalNote> {
  await ensureLocalSqliteMigrationReady()

  const existing = await getNoteRow(id)
  if (!existing) throw new Error('Note not found')

  const updatedAt = new Date().toISOString()
  const nextVersion = (existing.version ?? 1) + 1
  const title = typeof input.title === 'string' ? normalizeText(input.title) : existing.title ?? null
  const content = typeof input.content === 'string' ? normalizeText(input.content) : existing.content ?? null
  const pinnedAt = Object.prototype.hasOwnProperty.call(input, 'pinnedAt')
    ? input.pinnedAt ?? null
    : existing.pinned_at ?? null

  await runSqlAsync(
    `UPDATE local_notes
      SET title = ?, content = ?, pinned_at = ?, updated_at = ?, dirty = ?, version = ?
      WHERE id = ?;`,
    [title, content, pinnedAt, updatedAt, 1, nextVersion, id]
  )

  const next = await getNoteRow(id)
  if (!next) throw new Error('Note not found')

  return toNoteView(next)
}

export async function deleteLocalNote(id: string): Promise<void> {
  await ensureLocalSqliteMigrationReady()
  const existing = await getNoteRow(id, true)
  if (!existing) return

  const shouldSoftDeleteForSync = Boolean(existing.cloud_id || existing.owner_user_id)
  if (shouldSoftDeleteForSync) {
    const now = new Date().toISOString()
    await runSqlAsync(
      `UPDATE local_notes
        SET deleted_at = ?, updated_at = ?, dirty = ?, version = ?
        WHERE id = ?;`,
      [now, now, 1, (existing.version ?? 1) + 1, id]
    )
    return
  }

  await runSqlAsync('DELETE FROM local_notes WHERE id = ?;', [id])
}

function toSyncRow(row: LocalNoteRow): LocalNoteSyncRow {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id ?? null,
    cloudId: row.cloud_id ?? null,
    title: row.title ?? null,
    content: row.content ?? null,
    pinnedAt: row.pinned_at ?? null,
    deletedAt: row.deleted_at ?? null,
  }
}

export async function listDirtyLocalNoteRowsForSync(limit = 100): Promise<LocalNoteSyncRow[]> {
  await ensureLocalSqliteMigrationReady()
  const rows = await getAllAsync<LocalNoteRow>(
    `SELECT * FROM local_notes
      WHERE dirty = 1
      ORDER BY updated_at ASC
      LIMIT ?;`,
    [limit]
  )
  return rows.map(toSyncRow)
}

export async function markLocalNoteSynced(params: {
  localId: string
  ownerUserId: string
  cloudId: string
}) {
  await ensureLocalSqliteMigrationReady()
  const now = new Date().toISOString()
  await runSqlAsync(
    `UPDATE local_notes
      SET owner_user_id = ?, cloud_id = ?, dirty = ?, deleted_at = ?, last_synced_at = ?, updated_at = ?
      WHERE id = ?;`,
    [params.ownerUserId, params.cloudId, 0, null, now, now, params.localId]
  )
}

export async function mergeCloudNotesIntoLocal(params: {
  ownerUserId: string
  cloudNotes: Note[]
}) {
  await ensureLocalSqliteMigrationReady()

  const ownerUserId = params.ownerUserId.trim()
  if (!ownerUserId) return

  const cloudNotes = params.cloudNotes
  const now = new Date().toISOString()
  const cloudIds = new Set(cloudNotes.map((note) => note.id))
  const existingRows = await getAllAsync<LocalNoteRow>(
    'SELECT * FROM local_notes WHERE owner_user_id = ? OR owner_user_id IS NULL;',
    [ownerUserId]
  )

  const byCloudId = new Map<string, LocalNoteRow>()
  for (const row of existingRows) {
    if (row.cloud_id) {
      byCloudId.set(row.cloud_id, row)
    }
  }

  for (const cloudNote of cloudNotes) {
    const existing = byCloudId.get(cloudNote.id)
    if (existing) {
      if (existing.dirty === 1) continue

      await runSqlAsync(
        `UPDATE local_notes
          SET
            title = ?,
            content = ?,
            pinned_at = ?,
            created_at = ?,
            updated_at = ?,
            deleted_at = ?,
            owner_user_id = ?,
            cloud_id = ?,
            dirty = ?,
            last_synced_at = ?
          WHERE id = ?;`,
        [
          cloudNote.title ?? null,
          cloudNote.content ?? null,
          cloudNote.pinnedAt ?? null,
          cloudNote.createdAt ?? now,
          cloudNote.updatedAt ?? cloudNote.createdAt ?? now,
          null,
          ownerUserId,
          cloudNote.id,
          0,
          now,
          existing.id,
        ]
      )
      continue
    }

    const localId = `cloud_${cloudNote.id}`
    await runSqlAsync(
      `INSERT INTO local_notes
        (
          id, title, content, pinned_at, created_at, updated_at, deleted_at,
          owner_user_id, cloud_id, dirty, version, last_synced_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          content = excluded.content,
          pinned_at = excluded.pinned_at,
          created_at = excluded.created_at,
          updated_at = excluded.updated_at,
          deleted_at = excluded.deleted_at,
          owner_user_id = excluded.owner_user_id,
          cloud_id = excluded.cloud_id,
          dirty = excluded.dirty,
          last_synced_at = excluded.last_synced_at
        WHERE local_notes.dirty IS NULL OR local_notes.dirty != 1;`,
      [
        localId,
        cloudNote.title ?? null,
        cloudNote.content ?? null,
        cloudNote.pinnedAt ?? null,
        cloudNote.createdAt ?? now,
        cloudNote.updatedAt ?? cloudNote.createdAt ?? now,
        null,
        ownerUserId,
        cloudNote.id,
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
      await runSqlAsync('DELETE FROM local_notes WHERE id = ?;', [existing.id])
    }
  }
}

export async function purgeLocalNoteRow(localId: string) {
  await ensureLocalSqliteMigrationReady()
  await runSqlAsync('DELETE FROM local_notes WHERE id = ?;', [localId])
}
