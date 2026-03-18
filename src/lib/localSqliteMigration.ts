import AsyncStorage from '@react-native-async-storage/async-storage'

import { getAllAsync, runSqlAsync, runSqlBatchAsync } from '@/lib/sqlite'

const RECIPES_KEY = 'recipes:local'
const NOTES_KEY = 'notes:local'
const FOLDERS_KEY = 'folders:local'
const MIGRATION_DONE_KEY = 'sqlite:migration:local-entities:v1'

const TABLE_SETUP_STATEMENTS = [
  {
    sql: `CREATE TABLE IF NOT EXISTS local_recipes (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      subtitle TEXT,
      description TEXT,
      emoji TEXT,
      image_url TEXT,
      steps_text TEXT,
      ingredients_json TEXT NOT NULL,
      folders_json TEXT NOT NULL,
      meal_times_json TEXT NOT NULL DEFAULT '[]',
      prep_time_minutes INTEGER,
      cook_time_minutes INTEGER,
      servings INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      owner_user_id TEXT,
      cloud_id TEXT,
      dirty INTEGER,
      version INTEGER,
      last_synced_at TEXT
    );`,
  },
  {
    sql: `CREATE TABLE IF NOT EXISTS local_notes (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT,
      content TEXT,
      pinned_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      owner_user_id TEXT,
      cloud_id TEXT,
      dirty INTEGER,
      version INTEGER,
      last_synced_at TEXT
    );`,
  },
  {
    sql: `CREATE TABLE IF NOT EXISTS local_folders (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      emoji TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      owner_user_id TEXT,
      cloud_id TEXT,
      dirty INTEGER,
      version INTEGER,
      last_synced_at TEXT
    );`,
  },
  {
    sql: 'CREATE INDEX IF NOT EXISTS local_recipes_updated_at_idx ON local_recipes(updated_at);',
  },
  {
    sql: 'CREATE INDEX IF NOT EXISTS local_recipes_title_idx ON local_recipes(title COLLATE NOCASE);',
  },
  {
    sql: 'CREATE INDEX IF NOT EXISTS local_notes_updated_at_idx ON local_notes(updated_at);',
  },
  {
    sql: 'CREATE INDEX IF NOT EXISTS local_notes_title_idx ON local_notes(title COLLATE NOCASE);',
  },
  {
    sql: 'CREATE INDEX IF NOT EXISTS local_folders_name_idx ON local_folders(name);',
  },
  {
    sql: 'CREATE INDEX IF NOT EXISTS local_folders_name_nocase_idx ON local_folders(name COLLATE NOCASE);',
  },
]

let migrationPromise: Promise<void> | null = null

function nowIso() {
  return new Date().toISOString()
}

function parseArray(raw: string | null): any[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function normalizeString(value: any): string | null {
  if (typeof value !== 'string') return null
  return value
}

function normalizeNumber(value: any): number | null {
  return typeof value === 'number' ? value : null
}

function normalizeArrayJson(value: any): string {
  return JSON.stringify(Array.isArray(value) ? value : [])
}

function normalizeRecipeRow(row: any) {
  const createdAt = normalizeString(row.created_at) ?? normalizeString(row.createdAt) ?? nowIso()
  const updatedAt = normalizeString(row.updated_at) ?? normalizeString(row.updatedAt) ?? createdAt
  const stepsText =
    normalizeString(row.steps_text) ??
    (Array.isArray(row.steps) ? row.steps.filter((step: any) => typeof step === 'string').join('\n') : null)

  return {
    id: normalizeString(row.id),
    title: normalizeString(row.title) ?? '',
    subtitle: normalizeString(row.subtitle),
    description: normalizeString(row.description),
    emoji: normalizeString(row.emoji),
    image_url: normalizeString(row.image_url) ?? normalizeString(row.imageUrl),
    steps_text: stepsText,
    ingredients_json: normalizeArrayJson(row.ingredients),
    folders_json: normalizeArrayJson(row.folders),
    meal_times_json: normalizeArrayJson(row.meal_times ?? row.mealTimes),
    prep_time_minutes: normalizeNumber(row.prep_time_minutes) ?? normalizeNumber(row.prepTimeMinutes),
    cook_time_minutes: normalizeNumber(row.cook_time_minutes) ?? normalizeNumber(row.cookTimeMinutes),
    servings: normalizeNumber(row.servings),
    created_at: createdAt,
    updated_at: updatedAt,
    deleted_at: normalizeString(row.deleted_at),
    owner_user_id: normalizeString(row.owner_user_id),
    cloud_id: normalizeString(row.cloud_id),
    dirty: normalizeNumber(row.dirty) ?? 1,
    version: normalizeNumber(row.version) ?? 1,
    last_synced_at: normalizeString(row.last_synced_at),
  }
}

function normalizeNoteRow(row: any) {
  const createdAt = normalizeString(row.created_at) ?? normalizeString(row.createdAt) ?? nowIso()
  const updatedAt = normalizeString(row.updated_at) ?? normalizeString(row.updatedAt) ?? createdAt

  return {
    id: normalizeString(row.id),
    title: normalizeString(row.title),
    content: normalizeString(row.content),
    pinned_at: normalizeString(row.pinned_at) ?? normalizeString(row.pinnedAt),
    created_at: createdAt,
    updated_at: updatedAt,
    deleted_at: normalizeString(row.deleted_at),
    owner_user_id: normalizeString(row.owner_user_id),
    cloud_id: normalizeString(row.cloud_id),
    dirty: normalizeNumber(row.dirty) ?? 1,
    version: normalizeNumber(row.version) ?? 1,
    last_synced_at: normalizeString(row.last_synced_at),
  }
}

function normalizeFolderRow(row: any) {
  const createdAt = normalizeString(row.created_at) ?? normalizeString(row.createdAt) ?? nowIso()
  const updatedAt = normalizeString(row.updated_at) ?? normalizeString(row.updatedAt) ?? createdAt

  return {
    id: normalizeString(row.id),
    name: normalizeString(row.name) ?? '',
    emoji: normalizeString(row.emoji),
    created_at: createdAt,
    updated_at: updatedAt,
    deleted_at: normalizeString(row.deleted_at),
    owner_user_id: normalizeString(row.owner_user_id),
    cloud_id: normalizeString(row.cloud_id),
    dirty: normalizeNumber(row.dirty) ?? 1,
    version: normalizeNumber(row.version) ?? 1,
    last_synced_at: normalizeString(row.last_synced_at),
  }
}

function chunkStatements<T>(items: T[], build: (item: T) => { sql: string; params: (string | number | null)[] }, size = 200) {
  const chunks: { sql: string; params: (string | number | null)[] }[][] = []
  for (let i = 0; i < items.length; i += size) {
    const slice = items.slice(i, i + size).map(build)
    chunks.push(slice)
  }
  return chunks
}

async function ensureLocalNotesPinnedColumn() {
  const columns = await getAllAsync<{ name: string }>('PRAGMA table_info(local_notes);')
  const hasPinnedAt = columns.some((column) => column.name === 'pinned_at')
  if (!hasPinnedAt) {
    await runSqlAsync('ALTER TABLE local_notes ADD COLUMN pinned_at TEXT;')
  }
  await runSqlAsync('CREATE INDEX IF NOT EXISTS local_notes_pinned_at_idx ON local_notes(pinned_at);')
}

async function ensureLocalRecipesMealTimesColumn() {
  const columns = await getAllAsync<{ name: string }>('PRAGMA table_info(local_recipes);')
  const hasMealTimesJson = columns.some((column) => column.name === 'meal_times_json')
  if (!hasMealTimesJson) {
    await runSqlAsync("ALTER TABLE local_recipes ADD COLUMN meal_times_json TEXT NOT NULL DEFAULT '[]';")
  }
}

export async function migrateLocalAsyncStorageToSqlite() {
  await runSqlBatchAsync(TABLE_SETUP_STATEMENTS)
  await ensureLocalNotesPinnedColumn()
  await ensureLocalRecipesMealTimesColumn()

  const alreadyDone = await AsyncStorage.getItem(MIGRATION_DONE_KEY)
  if (alreadyDone === '1') return

  const [recipesRaw, notesRaw, foldersRaw] = await Promise.all([
    AsyncStorage.getItem(RECIPES_KEY),
    AsyncStorage.getItem(NOTES_KEY),
    AsyncStorage.getItem(FOLDERS_KEY),
  ])

  const recipes = parseArray(recipesRaw).map(normalizeRecipeRow).filter((row) => row.id)
  const notes = parseArray(notesRaw).map(normalizeNoteRow).filter((row) => row.id)
  const folders = parseArray(foldersRaw).map(normalizeFolderRow).filter((row) => row.id)

  const recipeChunks = chunkStatements(recipes, (row) => ({
    sql: `INSERT OR IGNORE INTO local_recipes
      (
        id, title, subtitle, description, emoji, image_url, steps_text,
        ingredients_json, folders_json, meal_times_json, prep_time_minutes,
        cook_time_minutes, servings, created_at, updated_at, deleted_at,
        owner_user_id, cloud_id, dirty, version, last_synced_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    params: [
      row.id,
      row.title,
      row.subtitle,
      row.description,
      row.emoji,
      row.image_url,
      row.steps_text,
      row.ingredients_json,
      row.folders_json,
      row.meal_times_json,
      row.prep_time_minutes,
      row.cook_time_minutes,
      row.servings,
      row.created_at,
      row.updated_at,
      row.deleted_at,
      row.owner_user_id,
      row.cloud_id,
      row.dirty,
      row.version,
      row.last_synced_at,
    ],
  }))

  const noteChunks = chunkStatements(notes, (row) => ({
    sql: `INSERT OR IGNORE INTO local_notes
      (
        id, title, content, pinned_at, created_at, updated_at, deleted_at,
        owner_user_id, cloud_id, dirty, version, last_synced_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    params: [
      row.id,
      row.title,
      row.content,
      row.pinned_at,
      row.created_at,
      row.updated_at,
      row.deleted_at,
      row.owner_user_id,
      row.cloud_id,
      row.dirty,
      row.version,
      row.last_synced_at,
    ],
  }))

  const folderChunks = chunkStatements(folders, (row) => ({
    sql: `INSERT OR IGNORE INTO local_folders
      (
        id, name, emoji, created_at, updated_at, deleted_at,
        owner_user_id, cloud_id, dirty, version, last_synced_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    params: [
      row.id,
      row.name,
      row.emoji,
      row.created_at,
      row.updated_at,
      row.deleted_at,
      row.owner_user_id,
      row.cloud_id,
      row.dirty,
      row.version,
      row.last_synced_at,
    ],
  }))

  for (const statements of [...recipeChunks, ...noteChunks, ...folderChunks]) {
    if (statements.length === 0) continue
    await runSqlBatchAsync(statements)
  }

  await AsyncStorage.setItem(MIGRATION_DONE_KEY, '1')
}

export function ensureLocalSqliteMigrationReady() {
  if (!migrationPromise) {
    migrationPromise = migrateLocalAsyncStorageToSqlite().catch((error) => {
      migrationPromise = null
      throw error
    })
  }
  return migrationPromise
}
