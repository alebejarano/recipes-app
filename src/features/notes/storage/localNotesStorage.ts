import { ensureLocalSqliteMigrationReady } from '@/lib/localSqliteMigration'
import { getAllAsync, getFirstAsync, runSqlAsync } from '@/lib/sqlite'

type LocalNoteRow = {
  id: string
  title: string | null
  content: string | null
  created_at: string
  updated_at: string
  deleted_at?: string | null
  owner_user_id?: string | null
  cloud_id?: string | null
  dirty?: number
  version?: number
  last_synced_at?: string | null
}

export type LocalNote = {
  id: string
  title: string | null
  content: string | null
  createdAt: string
  updatedAt: string
}

type LocalNotesListParams = {
  limit?: number
  search?: string
}

function makeId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

async function listNoteRows(params?: LocalNotesListParams): Promise<LocalNoteRow[]> {
  await ensureLocalSqliteMigrationReady()
  const limit = params?.limit ?? 200
  const search = params?.search?.trim()
  if (search) {
    return getAllAsync<LocalNoteRow>(
      `SELECT * FROM local_notes
       WHERE title LIKE ? COLLATE NOCASE
          OR content LIKE ? COLLATE NOCASE
       ORDER BY updated_at DESC
       LIMIT ?;`,
      [`%${search}%`, `%${search}%`, limit]
    )
  }
  return getAllAsync<LocalNoteRow>(
    'SELECT * FROM local_notes ORDER BY created_at DESC LIMIT ?;',
    [limit]
  )
}

async function getNoteRow(id: string): Promise<LocalNoteRow | null> {
  await ensureLocalSqliteMigrationReady()
  return getFirstAsync<LocalNoteRow>(
    'SELECT * FROM local_notes WHERE id = ? LIMIT 1;',
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
}): Promise<LocalNote> {
  await ensureLocalSqliteMigrationReady()
  const now = new Date().toISOString()
  const note: LocalNoteRow = {
    id: makeId(),
    title: normalizeText(input.title),
    content: normalizeText(input.content),
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
        owner_user_id, cloud_id, dirty, version, last_synced_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
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
    ]
  )

  return toNoteView(note)
}

export async function updateLocalNote(
  id: string,
  input: { title: string; content: string }
): Promise<LocalNote> {
  await ensureLocalSqliteMigrationReady()

  const existing = await getNoteRow(id)
  if (!existing) throw new Error('Note not found')

  const updatedAt = new Date().toISOString()
  const nextVersion = (existing.version ?? 1) + 1
  const title = normalizeText(input.title)
  const content = normalizeText(input.content)

  await runSqlAsync(
    `UPDATE local_notes
      SET title = ?, content = ?, updated_at = ?, dirty = ?, version = ?
      WHERE id = ?;`,
    [title, content, updatedAt, 1, nextVersion, id]
  )

  const next = await getNoteRow(id)
  if (!next) throw new Error('Note not found')

  return toNoteView(next)
}

export async function deleteLocalNote(id: string): Promise<void> {
  await ensureLocalSqliteMigrationReady()
  await runSqlAsync('DELETE FROM local_notes WHERE id = ?;', [id])
}
