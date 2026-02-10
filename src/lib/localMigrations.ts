import AsyncStorage from '@react-native-async-storage/async-storage'

const RECIPES_KEY = 'recipes:local'
const NOTES_KEY = 'notes:local'
const FOLDERS_KEY = 'folders:local'

function nowIso() {
  return new Date().toISOString()
}

function migrateRecipes(raw: string): string {
  let parsed: any
  try {
    parsed = JSON.parse(raw)
  } catch {
    return raw
  }
  if (!Array.isArray(parsed)) return raw

  const next = parsed.map((row: any) => {
    const created = row.created_at ?? row.createdAt ?? nowIso()
    const updated = row.updated_at ?? row.updatedAt ?? created
    const stepsText =
      typeof row.steps_text === 'string'
        ? row.steps_text
        : Array.isArray(row.steps)
          ? row.steps.join('\n')
          : null

    return {
      id: row.id,
      title: row.title ?? '',
      subtitle: row.subtitle ?? null,
      description: row.description ?? null,
      emoji: row.emoji ?? null,
      image_url: row.image_url ?? row.imageUrl ?? null,
      steps_text: stepsText,
      ingredients: Array.isArray(row.ingredients) ? row.ingredients : [],
      folders: Array.isArray(row.folders) ? row.folders : [],
      prep_time_minutes: row.prep_time_minutes ?? row.prepTimeMinutes ?? null,
      cook_time_minutes: row.cook_time_minutes ?? row.cookTimeMinutes ?? null,
      servings: row.servings ?? null,
      created_at: created,
      updated_at: updated,
      deleted_at: row.deleted_at ?? null,
      owner_user_id: row.owner_user_id ?? null,
      cloud_id: row.cloud_id ?? null,
      dirty: typeof row.dirty === 'number' ? row.dirty : 1,
      version: typeof row.version === 'number' ? row.version : 1,
      last_synced_at: row.last_synced_at ?? null,
    }
  })

  return JSON.stringify(next)
}

function migrateNotes(raw: string): string {
  let parsed: any
  try {
    parsed = JSON.parse(raw)
  } catch {
    return raw
  }
  if (!Array.isArray(parsed)) return raw

  const next = parsed.map((row: any) => {
    const created = row.created_at ?? row.createdAt ?? nowIso()
    const updated = row.updated_at ?? row.updatedAt ?? created

    return {
      id: row.id,
      title: row.title ?? null,
      content: row.content ?? null,
      created_at: created,
      updated_at: updated,
      deleted_at: row.deleted_at ?? null,
      owner_user_id: row.owner_user_id ?? null,
      cloud_id: row.cloud_id ?? null,
      dirty: typeof row.dirty === 'number' ? row.dirty : 1,
      version: typeof row.version === 'number' ? row.version : 1,
      last_synced_at: row.last_synced_at ?? null,
    }
  })

  return JSON.stringify(next)
}

function migrateFolders(raw: string): string {
  let parsed: any
  try {
    parsed = JSON.parse(raw)
  } catch {
    return raw
  }
  if (!Array.isArray(parsed)) return raw

  const next = parsed.map((row: any) => {
    const created = row.created_at ?? row.createdAt ?? nowIso()
    const updated = row.updated_at ?? row.updatedAt ?? created

    return {
      id: row.id,
      name: row.name ?? '',
      emoji: row.emoji ?? null,
      created_at: created,
      updated_at: updated,
      deleted_at: row.deleted_at ?? null,
      owner_user_id: row.owner_user_id ?? null,
      cloud_id: row.cloud_id ?? null,
      dirty: typeof row.dirty === 'number' ? row.dirty : 1,
      version: typeof row.version === 'number' ? row.version : 1,
      last_synced_at: row.last_synced_at ?? null,
    }
  })

  return JSON.stringify(next)
}

export async function runLocalMigrations() {
  const [recipesRaw, notesRaw, foldersRaw] = await Promise.all([
    AsyncStorage.getItem(RECIPES_KEY),
    AsyncStorage.getItem(NOTES_KEY),
    AsyncStorage.getItem(FOLDERS_KEY),
  ])

  const tasks: Promise<void>[] = []

  if (recipesRaw) {
    const migrated = migrateRecipes(recipesRaw)
    if (migrated !== recipesRaw) {
      tasks.push(AsyncStorage.setItem(RECIPES_KEY, migrated))
    }
  }

  if (notesRaw) {
    const migrated = migrateNotes(notesRaw)
    if (migrated !== notesRaw) {
      tasks.push(AsyncStorage.setItem(NOTES_KEY, migrated))
    }
  }

  if (foldersRaw) {
    const migrated = migrateFolders(foldersRaw)
    if (migrated !== foldersRaw) {
      tasks.push(AsyncStorage.setItem(FOLDERS_KEY, migrated))
    }
  }

  if (tasks.length > 0) {
    await Promise.all(tasks)
  }
}
