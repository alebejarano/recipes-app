import AsyncStorage from '@react-native-async-storage/async-storage'

import { createNote } from '@/features/notes/api/notesRepo'
import { createRecipe } from '@/features/recipes/api/recipesRepo'

const RECIPES_KEY = 'recipes:local'
const NOTES_KEY = 'notes:local'

type LocalRecipeRow = {
  id: string
  owner_user_id?: string | null
  cloud_id?: string | null
  title?: string | null
  subtitle?: string | null
  description?: string | null
  emoji?: string | null
  image_url?: string | null
  steps_text?: string | null
  ingredients?: { name?: string | null }[] | null
  folders?: { name?: string | null }[] | null
  prep_time_minutes?: number | null
  cook_time_minutes?: number | null
  servings?: number | null
  deleted_at?: string | null
  last_synced_at?: string | null
  dirty?: number
}

type LocalNoteRow = {
  id: string
  owner_user_id?: string | null
  cloud_id?: string | null
  title?: string | null
  content?: string | null
  deleted_at?: string | null
  last_synced_at?: string | null
  dirty?: number
}

type MigrationSummary = {
  recipesUploaded: number
  notesUploaded: number
  failures: string[]
}

function parseRows<T>(raw: string | null): T[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch {
    return []
  }
}

function parseSteps(stepsText?: string | null) {
  if (!stepsText) return []
  return stepsText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function parseIngredientNames(list: LocalRecipeRow['ingredients']) {
  if (!Array.isArray(list)) return []
  return list
    .map((item) => (typeof item?.name === 'string' ? item.name.trim() : ''))
    .filter(Boolean)
}

function parseFolderNames(list: LocalRecipeRow['folders']) {
  if (!Array.isArray(list)) return []
  return list
    .map((item) => (typeof item?.name === 'string' ? item.name.trim() : ''))
    .filter(Boolean)
}

export async function migrateLocalDataToCloudOnPremium(userId: string): Promise<MigrationSummary> {
  const ownerUserId = userId.trim()
  if (!ownerUserId) {
    return {
      recipesUploaded: 0,
      notesUploaded: 0,
      failures: ['Missing user id for migration'],
    }
  }

  const [recipesRaw, notesRaw] = await Promise.all([
    AsyncStorage.getItem(RECIPES_KEY),
    AsyncStorage.getItem(NOTES_KEY),
  ])

  const recipes = parseRows<LocalRecipeRow>(recipesRaw)
  const notes = parseRows<LocalNoteRow>(notesRaw)
  const failures: string[] = []

  let recipesUploaded = 0
  let notesUploaded = 0

  const now = new Date().toISOString()
  const nextRecipes: LocalRecipeRow[] = [...recipes]
  const nextNotes: LocalNoteRow[] = [...notes]

  for (let i = 0; i < nextRecipes.length; i += 1) {
    const row = nextRecipes[i]
    const belongsToUser = !row.owner_user_id || row.owner_user_id === ownerUserId
    const alreadySynced = Boolean(row.last_synced_at || row.cloud_id)
    const isDeleted = Boolean(row.deleted_at)
    if (!belongsToUser || alreadySynced || isDeleted) continue

    try {
      const created = await createRecipe({
        title: row.title?.trim() || 'Untitled recipe',
        subtitle: row.subtitle ?? null,
        description: row.description ?? null,
        emoji: row.emoji ?? null,
        imageUrl: row.image_url ?? null,
        ingredients: parseIngredientNames(row.ingredients),
        steps: parseSteps(row.steps_text),
        folders: parseFolderNames(row.folders),
        prepTimeMinutes: row.prep_time_minutes ?? null,
        cookTimeMinutes: row.cook_time_minutes ?? null,
        servings: row.servings ?? null,
      })

      nextRecipes[i] = {
        ...row,
        owner_user_id: ownerUserId,
        cloud_id: created.id,
        dirty: 0,
        last_synced_at: now,
      }
      recipesUploaded += 1
    } catch (error: any) {
      failures.push(`Recipe "${row.title ?? row.id}": ${error?.message ?? 'unknown error'}`)
    }
  }

  for (let i = 0; i < nextNotes.length; i += 1) {
    const row = nextNotes[i]
    const belongsToUser = !row.owner_user_id || row.owner_user_id === ownerUserId
    const alreadySynced = Boolean(row.last_synced_at || row.cloud_id)
    const isDeleted = Boolean(row.deleted_at)
    if (!belongsToUser || alreadySynced || isDeleted) continue

    try {
      const created = await createNote({
        title: row.title?.trim() ?? '',
        content: row.content?.trim() ?? '',
      })

      nextNotes[i] = {
        ...row,
        owner_user_id: ownerUserId,
        cloud_id: created.id,
        dirty: 0,
        last_synced_at: now,
      }
      notesUploaded += 1
    } catch (error: any) {
      failures.push(`Note "${row.title ?? row.id}": ${error?.message ?? 'unknown error'}`)
    }
  }

  await Promise.all([
    AsyncStorage.setItem(RECIPES_KEY, JSON.stringify(nextRecipes)),
    AsyncStorage.setItem(NOTES_KEY, JSON.stringify(nextNotes)),
  ])

  return {
    recipesUploaded,
    notesUploaded,
    failures,
  }
}
