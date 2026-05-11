import { ensureLocalSqliteMigrationReady } from '@/lib/localSqliteMigration'
import { getAllAsync, runSqlAsync } from '@/lib/sqlite'
import { createNote } from '@/features/notes/api/notesRepo'
import { createRecipe, ensureCloudRecipeImageUrl } from '@/features/recipes/api/recipesRepo'
import { normalizeMealTimes } from '@/features/recipes/types/mealTimes'
import { getUserFacingErrorMessage } from '@/lib/userFacingError'

type LocalRecipeRow = {
  id: string
  owner_user_id: string | null
  cloud_id: string | null
  title: string | null
  subtitle: string | null
  description: string | null
  emoji: string | null
  image_url: string | null
  steps_text: string | null
  ingredients_json: string | null
  folders_json: string | null
  meal_times_json: string | null
  prep_time_minutes: number | null
  cook_time_minutes: number | null
  servings: number | null
  deleted_at: string | null
  last_synced_at: string | null
  dirty: number | null
}

type LocalNoteRow = {
  id: string
  owner_user_id: string | null
  cloud_id: string | null
  title: string | null
  content: string | null
  pinned_at: string | null
  deleted_at: string | null
  last_synced_at: string | null
  dirty: number | null
}

type MigrationSummary = {
  recipesUploaded: number
  notesUploaded: number
  failures: string[]
}

function parseSteps(stepsText?: string | null) {
  if (!stepsText) return []
  return stepsText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function parseJsonArray<T>(raw: string | null | undefined): T[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch {
    return []
  }
}

function parseIngredientNames(raw: LocalRecipeRow['ingredients_json']) {
  const list = parseJsonArray<{ name?: string | null }>(raw)
  return list
    .map((item) => (typeof item?.name === 'string' ? item.name.trim() : ''))
    .filter(Boolean)
}

function parseFolderNames(raw: LocalRecipeRow['folders_json']) {
  const list = parseJsonArray<{ name?: string | null }>(raw)
  return list
    .map((item) => (typeof item?.name === 'string' ? item.name.trim() : ''))
    .filter(Boolean)
}

function parseMealTimes(raw: LocalRecipeRow['meal_times_json']) {
  const list = parseJsonArray<string>(raw)
  return normalizeMealTimes(
    list
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean)
  )
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

  await ensureLocalSqliteMigrationReady()
  const [recipes, notes] = await Promise.all([
    getAllAsync<LocalRecipeRow>('SELECT * FROM local_recipes;'),
    getAllAsync<LocalNoteRow>('SELECT * FROM local_notes;'),
  ])
  const failures: string[] = []

  let recipesUploaded = 0
  let notesUploaded = 0

  const now = new Date().toISOString()

  for (const row of recipes) {
    const belongsToUser = !row.owner_user_id || row.owner_user_id === ownerUserId
    const alreadySynced = Boolean(row.last_synced_at || row.cloud_id)
    const isDeleted = Boolean(row.deleted_at)
    if (!belongsToUser || alreadySynced || isDeleted) continue

    try {
      const imageUrl = await ensureCloudRecipeImageUrl(row.image_url ?? null)
      const created = await createRecipe({
        title: row.title?.trim() || 'Untitled recipe',
        subtitle: row.subtitle ?? null,
        description: row.description ?? null,
        emoji: row.emoji ?? null,
        imageUrl,
        ingredients: parseIngredientNames(row.ingredients_json),
        steps: parseSteps(row.steps_text),
        folders: parseFolderNames(row.folders_json),
        mealTimes: parseMealTimes(row.meal_times_json),
        prepTimeMinutes: row.prep_time_minutes ?? null,
        cookTimeMinutes: row.cook_time_minutes ?? null,
        servings: row.servings ?? null,
      })

      await runSqlAsync(
        `UPDATE local_recipes
          SET owner_user_id = ?, cloud_id = ?, dirty = ?, last_synced_at = ?, updated_at = ?
          WHERE id = ?;`,
        [ownerUserId, created.id, 0, now, now, row.id]
      )
      recipesUploaded += 1
    } catch (error) {
      failures.push(
        `A recipe could not be uploaded: ${getUserFacingErrorMessage(error, 'Please try again.')}`
      )
    }
  }

  for (const row of notes) {
    const belongsToUser = !row.owner_user_id || row.owner_user_id === ownerUserId
    const alreadySynced = Boolean(row.last_synced_at || row.cloud_id)
    const isDeleted = Boolean(row.deleted_at)
    if (!belongsToUser || alreadySynced || isDeleted) continue

    try {
      const created = await createNote({
        title: row.title?.trim() ?? '',
        content: row.content?.trim() ?? '',
        pinnedAt: row.pinned_at ?? null,
      })

      await runSqlAsync(
        `UPDATE local_notes
          SET owner_user_id = ?, cloud_id = ?, dirty = ?, last_synced_at = ?, updated_at = ?
          WHERE id = ?;`,
        [ownerUserId, created.id, 0, now, now, row.id]
      )
      notesUploaded += 1
    } catch (error) {
      failures.push(
        `A note could not be uploaded: ${getUserFacingErrorMessage(error, 'Please try again.')}`
      )
    }
  }

  return {
    recipesUploaded,
    notesUploaded,
    failures,
  }
}
