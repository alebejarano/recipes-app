import AsyncStorage from '@react-native-async-storage/async-storage'

const STORAGE_KEY = 'folders:local'

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

function makeId() {
  const randomUuid = globalThis.crypto?.randomUUID?.()
  if (randomUuid) return randomUuid
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

async function readAll(): Promise<LocalFolderRow[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as LocalFolderRow[]
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

async function writeAll(rows: LocalFolderRow[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(rows))
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

export async function listLocalFolders(): Promise<LocalFolder[]> {
  const rows = await readAll()
  return rows.map(toFolderView)
}

export async function createLocalFolder(input: {
  name: string
  emoji?: string | null
}): Promise<LocalFolder> {
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

  const rows = await readAll()
  const nextRows = [row, ...rows]
  await writeAll(nextRows)
  return toFolderView(row)
}

export async function updateLocalFolder(input: {
  id: string
  name: string
  emoji?: string | null
}): Promise<LocalFolder> {
  const rows = await readAll()
  const index = rows.findIndex((row) => row.id === input.id)
  if (index < 0) throw new Error('Folder not found')

  const existing = rows[index]
  const next: LocalFolderRow = {
    ...existing,
    name: input.name.trim(),
    emoji: input.emoji ?? null,
    updated_at: new Date().toISOString(),
    dirty: 1,
    version: (existing.version ?? 1) + 1,
  }

  const nextRows = [...rows]
  nextRows[index] = next
  await writeAll(nextRows)
  return toFolderView(next)
}

export async function deleteLocalFolder(id: string): Promise<void> {
  const rows = await readAll()
  const nextRows = rows.filter((row) => row.id !== id)
  await writeAll(nextRows)
}
