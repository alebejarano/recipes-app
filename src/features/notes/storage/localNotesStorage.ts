import AsyncStorage from '@react-native-async-storage/async-storage'

const STORAGE_KEY = 'notes:local'

type LocalNoteRow = {
  id: string
  title: string | null
  content: string | null
  created_at: string
  updated_at: string
  deleted_at?: string | null
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

function makeId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

async function readAll(): Promise<LocalNoteRow[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as LocalNoteRow[]
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

async function writeAll(notes: LocalNoteRow[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
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

export async function listLocalNotes(): Promise<LocalNote[]> {
  const rows = await readAll()
  return rows.map(toNoteView)
}

export async function getLocalNote(id: string): Promise<LocalNote | null> {
  const items = await readAll()
  const row = items.find((item) => item.id === id)
  return row ? toNoteView(row) : null
}

export async function createLocalNote(input: {
  title: string
  content: string
}): Promise<LocalNote> {
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
  const items = await readAll()
  await writeAll([note, ...items])
  return toNoteView(note)
}

export async function updateLocalNote(
  id: string,
  input: { title: string; content: string }
): Promise<LocalNote> {
  const items = await readAll()
  const index = items.findIndex((item) => item.id === id)
  if (index < 0) throw new Error('Note not found')

  const existing = items[index]
  const next: LocalNoteRow = {
    ...existing,
    title: normalizeText(input.title),
    content: normalizeText(input.content),
    updated_at: new Date().toISOString(),
    dirty: 1,
    version: (existing.version ?? 1) + 1,
  }

  const nextItems = [...items]
  nextItems[index] = next
  await writeAll(nextItems)
  return toNoteView(next)
}

export async function deleteLocalNote(id: string): Promise<void> {
  const items = await readAll()
  const nextItems = items.filter((item) => item.id !== id)
  await writeAll(nextItems)
}
