import { ensureLocalSqliteMigrationReady } from '@/lib/localSqliteMigration'
import { getAllAsync, getFirstAsync, runSqlAsync, runSqlBatchAsync } from '@/lib/sqlite'
import { File } from '@/lib/fileSystem'

import type { Recipe } from '@/features/recipes/api/recipesRepo'
import type { RecipeFormSubmitValues } from '@/features/recipes/components/RecipeForm'
import { deleteRecipePdfAttachmentsForRecipe } from '@/features/recipes/storage/recipePdfStorage'
import {
  importLocalImage,
  type ImportPlan,
  isManagedLocalImportImageUri,
  removeImportByUri,
} from '@/features/recipes/storage/importsStorage'
import { FREE_PLAN_MAX_RECIPES } from '@/features/subscription/constants/limits'

export type LocalRecipeIngredient = {
  id: string
  name: string
  quantity: string | null
  unit: string | null
  notes: string | null
  position: number
}

type LocalRecipeFolder = {
  id: string
  name: string
  emoji: string
}

type LocalFolderLookupRow = {
  id: string
  name: string
  emoji: string | null
}

type LocalRecipeRow = {
  id: string
  title: string
  subtitle: string | null
  description: string | null
  emoji: string | null
  image_url: string | null
  steps_text: string | null
  ingredients_json: string
  folders_json: string
  prep_time_minutes: number | null
  cook_time_minutes: number | null
  servings: number | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  owner_user_id: string | null
  cloud_id: string | null
  dirty: number
  version: number
  last_synced_at: string | null
}

type LocalRecipeFoldersRow = {
  id: string
  folders_json: string
  version: number | null
}

export type LocalRecipeSyncRow = {
  id: string
  ownerUserId: string | null
  cloudId: string | null
  title: string
  subtitle: string | null
  description: string | null
  emoji: string | null
  imageUrl: string | null
  stepsText: string | null
  ingredientsJson: string
  foldersJson: string
  prepTimeMinutes: number | null
  cookTimeMinutes: number | null
  servings: number | null
  deletedAt: string | null
}

export type LocalRecipe = {
  id: string
  title: string
  subtitle: string | null
  description: string | null
  emoji: string | null
  imageUrl: string | null
  steps: string[]
  ingredients: LocalRecipeIngredient[]
  folders: LocalRecipeFolder[]
  prepTimeMinutes: number | null
  cookTimeMinutes: number | null
  servings: number | null
  createdAt: string
  updatedAt: string
}

type LocalRecipeListParams = {
  limit?: number
  search?: string
}

function makeId() {
  const randomUuid = globalThis.crypto?.randomUUID?.()
  if (randomUuid) return randomUuid
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

function parseStepsText(value: string | null | undefined): string[] {
  if (!value) return []
  const trimmed = value.trim()
  if (!trimmed) return []
  return trimmed
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function serializeSteps(steps: string[] | null | undefined): string | null {
  if (!steps) return null
  const normalized = steps.map((step) => step.trim()).filter(Boolean)
  return normalized.length ? normalized.join('\n') : null
}

function parseJsonArray<T>(value: string | null | undefined): T[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value) as unknown
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch {
    return []
  }
}

function isRemoteUri(uri: string) {
  return /^https?:\/\//i.test(uri)
}

function inferNameFromUri(uri: string) {
  const raw = uri.split('/').pop() ?? ''
  const cleaned = raw.split('?')[0]?.trim() ?? ''
  return cleaned || 'recipe.jpg'
}

async function getLocalFileSize(uri: string): Promise<number> {
  try {
    const info = await new File(uri).info()
    return info.exists && 'size' in info && typeof info.size === 'number' ? info.size : 0
  } catch {
    return 0
  }
}

async function resolveLocalRecipeImageUrl(params: {
  imageUrl: string | null | undefined
  plan: ImportPlan
  replacingFileUri?: string | null
}): Promise<string | null> {
  const { imageUrl, plan, replacingFileUri } = params
  const nextImageUrl = imageUrl?.trim() ?? ''
  if (!nextImageUrl) return null
  if (isRemoteUri(nextImageUrl)) return nextImageUrl
  if (isManagedLocalImportImageUri(nextImageUrl)) return nextImageUrl

  const size = await getLocalFileSize(nextImageUrl)
  const imported = await importLocalImage({
    plan,
    uri: nextImageUrl,
    name: inferNameFromUri(nextImageUrl),
    size,
    replacingFileUri: replacingFileUri ?? null,
  })
  return imported.uri
}

function toRecipeView(row: LocalRecipeRow): LocalRecipe {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle ?? null,
    description: row.description ?? null,
    emoji: row.emoji ?? null,
    imageUrl: row.image_url ?? null,
    steps: parseStepsText(row.steps_text),
    ingredients: parseJsonArray<LocalRecipeIngredient>(row.ingredients_json),
    folders: parseJsonArray<LocalRecipeFolder>(row.folders_json),
    prepTimeMinutes: row.prep_time_minutes ?? null,
    cookTimeMinutes: row.cook_time_minutes ?? null,
    servings: row.servings ?? null,
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
  }
}

function buildIngredients(values: RecipeFormSubmitValues): LocalRecipeIngredient[] {
  const list = values.ingredients ?? []
  return list
    .map((name, index) => ({
      id: makeId(),
      name: name.trim(),
      quantity: null,
      unit: null,
      notes: null,
      position: index + 1,
    }))
    .filter((item) => item.name.length > 0)
}

async function buildFolders(values: RecipeFormSubmitValues): Promise<LocalRecipeFolder[]> {
  const list = values.folders ?? []
  const normalizedFolderNames = list
    .map((name) => name.trim())
    .filter(Boolean)

  if (normalizedFolderNames.length === 0) return []

  const localFolders = await getAllAsync<LocalFolderLookupRow>(
    'SELECT id, name, emoji FROM local_folders;'
  )

  const folderByName = new Map<string, LocalFolderLookupRow>()
  for (const folder of localFolders) {
    const key = folder.name.trim().toLowerCase()
    if (!key || folderByName.has(key)) continue
    folderByName.set(key, folder)
  }

  return normalizedFolderNames.map((name) => {
    const existing = folderByName.get(name.toLowerCase())
    return {
      id: existing?.id ?? name.toLowerCase(),
      name,
      emoji: existing?.emoji?.trim() || '📁',
    }
  })
}

async function listRecipeRows(params?: LocalRecipeListParams): Promise<LocalRecipeRow[]> {
  await ensureLocalSqliteMigrationReady()
  const limit = params?.limit ?? 200
  const search = params?.search?.trim()
  if (search) {
    return getAllAsync<LocalRecipeRow>(
      `SELECT * FROM local_recipes
       WHERE deleted_at IS NULL
         AND (
              title LIKE ? COLLATE NOCASE
          OR subtitle LIKE ? COLLATE NOCASE
          OR description LIKE ? COLLATE NOCASE
         )
       ORDER BY updated_at DESC
       LIMIT ?;`,
      [`%${search}%`, `%${search}%`, `%${search}%`, limit]
    )
  }
  return getAllAsync<LocalRecipeRow>(
    'SELECT * FROM local_recipes WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT ?;',
    [limit]
  )
}

async function getRecipeRow(id: string, includeDeleted = false): Promise<LocalRecipeRow | null> {
  await ensureLocalSqliteMigrationReady()
  const deletedFilter = includeDeleted ? '' : ' AND deleted_at IS NULL'
  return getFirstAsync<LocalRecipeRow>(
    `SELECT * FROM local_recipes WHERE id = ?${deletedFilter} LIMIT 1;`,
    [id]
  )
}

export async function listLocalRecipes(params?: LocalRecipeListParams): Promise<LocalRecipe[]> {
  const rows = await listRecipeRows(params)
  return rows.map(toRecipeView)
}

export async function getLocalRecipe(id: string): Promise<LocalRecipe | null> {
  const row = await getRecipeRow(id)
  return row ? toRecipeView(row) : null
}

export async function createLocalRecipe(
  values: RecipeFormSubmitValues,
  options?: { plan?: ImportPlan }
): Promise<LocalRecipe> {
  await ensureLocalSqliteMigrationReady()
  const plan = options?.plan ?? 'free'

  if (plan === 'free') {
    const countRow = await getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM local_recipes WHERE deleted_at IS NULL;'
    )
    if (Number(countRow?.count ?? 0) >= FREE_PLAN_MAX_RECIPES) {
      throw new Error(
        `Local plan limit reached. You can save up to ${FREE_PLAN_MAX_RECIPES} recipes on this device.`
      )
    }
  }

  const now = new Date().toISOString()
  const resolvedImageUrl = await resolveLocalRecipeImageUrl({
    imageUrl: values.imageUrl ?? null,
    plan,
  })
  const row: LocalRecipeRow = {
    id: makeId(),
    title: values.title,
    subtitle: values.subtitle ?? null,
    description: values.description ?? null,
    emoji: values.emoji ?? null,
    image_url: resolvedImageUrl,
    steps_text: serializeSteps(values.steps),
    ingredients_json: JSON.stringify(buildIngredients(values)),
    folders_json: JSON.stringify(await buildFolders(values)),
    prep_time_minutes: values.prepTimeMinutes ?? null,
    cook_time_minutes: values.cookTimeMinutes ?? null,
    servings: values.servings ?? null,
    created_at: now,
    updated_at: now,
    deleted_at: null,
    owner_user_id: null,
    cloud_id: null,
    dirty: 1,
    version: 1,
    last_synced_at: null,
  }

  await runSqlAsync(
    `INSERT INTO local_recipes
      (
        id, title, subtitle, description, emoji, image_url, steps_text,
        ingredients_json, folders_json, prep_time_minutes, cook_time_minutes,
        servings, created_at, updated_at, deleted_at, owner_user_id, cloud_id,
        dirty, version, last_synced_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      row.id,
      row.title,
      row.subtitle,
      row.description,
      row.emoji,
      row.image_url,
      row.steps_text,
      row.ingredients_json,
      row.folders_json,
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
    ]
  )

  return toRecipeView(row)
}

export async function updateLocalRecipe(
  id: string,
  values: RecipeFormSubmitValues,
  options?: { plan?: ImportPlan }
): Promise<LocalRecipe> {
  await ensureLocalSqliteMigrationReady()
  const plan = options?.plan ?? 'free'

  const existing = await getRecipeRow(id)
  if (!existing) throw new Error('Recipe not found')

  const updatedAt = new Date().toISOString()
  const nextVersion = (existing.version ?? 1) + 1
  const resolvedImageUrl = await resolveLocalRecipeImageUrl({
    imageUrl: values.imageUrl ?? null,
    plan,
    replacingFileUri:
      existing.image_url && isManagedLocalImportImageUri(existing.image_url)
        ? existing.image_url
        : null,
  })

  if (
    existing.image_url &&
    isManagedLocalImportImageUri(existing.image_url) &&
    existing.image_url !== resolvedImageUrl
  ) {
    await removeImportByUri(existing.image_url)
  }

  await runSqlAsync(
    `UPDATE local_recipes
      SET
        title = ?,
        subtitle = ?,
        description = ?,
        emoji = ?,
        image_url = ?,
        steps_text = ?,
        ingredients_json = ?,
        folders_json = ?,
        prep_time_minutes = ?,
        cook_time_minutes = ?,
        servings = ?,
        updated_at = ?,
        dirty = ?,
        version = ?
      WHERE id = ?;`,
    [
      values.title,
      values.subtitle ?? null,
      values.description ?? null,
      values.emoji ?? null,
      resolvedImageUrl,
      serializeSteps(values.steps),
      JSON.stringify(buildIngredients(values)),
      JSON.stringify(await buildFolders(values)),
      values.prepTimeMinutes ?? null,
      values.cookTimeMinutes ?? null,
      values.servings ?? null,
      updatedAt,
      1,
      nextVersion,
      id,
    ]
  )

  const next = await getRecipeRow(id)
  if (!next) throw new Error('Recipe not found')

  return toRecipeView(next)
}

export async function deleteLocalRecipe(id: string): Promise<void> {
  await ensureLocalSqliteMigrationReady()
  const existing = await getRecipeRow(id, true)
  if (!existing) return

  if (existing?.image_url && isManagedLocalImportImageUri(existing.image_url)) {
    await removeImportByUri(existing.image_url)
  }

  const shouldSoftDeleteForSync = Boolean(existing.cloud_id || existing.owner_user_id)
  if (shouldSoftDeleteForSync) {
    const now = new Date().toISOString()
    await runSqlAsync(
      `UPDATE local_recipes
        SET deleted_at = ?, updated_at = ?, dirty = ?, version = ?
        WHERE id = ?;`,
      [now, now, 1, (existing.version ?? 1) + 1, id]
    )
  } else {
    await runSqlAsync('DELETE FROM local_recipes WHERE id = ?;', [id])
  }

  await deleteRecipePdfAttachmentsForRecipe(id)
}

function toSyncRow(row: LocalRecipeRow): LocalRecipeSyncRow {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id ?? null,
    cloudId: row.cloud_id ?? null,
    title: row.title,
    subtitle: row.subtitle ?? null,
    description: row.description ?? null,
    emoji: row.emoji ?? null,
    imageUrl: row.image_url ?? null,
    stepsText: row.steps_text ?? null,
    ingredientsJson: row.ingredients_json,
    foldersJson: row.folders_json,
    prepTimeMinutes: row.prep_time_minutes ?? null,
    cookTimeMinutes: row.cook_time_minutes ?? null,
    servings: row.servings ?? null,
    deletedAt: row.deleted_at ?? null,
  }
}

export async function listDirtyLocalRecipeRowsForSync(limit = 100): Promise<LocalRecipeSyncRow[]> {
  await ensureLocalSqliteMigrationReady()
  const rows = await getAllAsync<LocalRecipeRow>(
    `SELECT * FROM local_recipes
      WHERE dirty = 1
      ORDER BY updated_at ASC
      LIMIT ?;`,
    [limit]
  )
  return rows.map(toSyncRow)
}

export async function markLocalRecipeSynced(params: {
  localId: string
  ownerUserId: string
  cloudId: string
}) {
  await ensureLocalSqliteMigrationReady()
  const now = new Date().toISOString()
  await runSqlAsync(
    `UPDATE local_recipes
      SET owner_user_id = ?, cloud_id = ?, dirty = ?, deleted_at = ?, last_synced_at = ?, updated_at = ?
      WHERE id = ?;`,
    [params.ownerUserId, params.cloudId, 0, null, now, now, params.localId]
  )
}

function serializeCloudIngredients(recipe: Recipe): string {
  return JSON.stringify(
    (recipe.ingredients ?? []).map((ingredient, index) => ({
      id: ingredient.id || `${recipe.id}_ingredient_${index + 1}`,
      name: ingredient.name ?? '',
      quantity: ingredient.quantity ?? null,
      unit: ingredient.unit ?? null,
      notes: ingredient.notes ?? null,
      position: ingredient.position ?? index + 1,
    }))
  )
}

function serializeCloudFolders(recipe: Recipe): string {
  return JSON.stringify(
    (recipe.folders ?? []).map((folder) => ({
      id: folder.id,
      name: folder.name,
      emoji: folder.emoji ?? '📁',
    }))
  )
}

export async function mergeCloudRecipesIntoLocal(params: {
  ownerUserId: string
  cloudRecipes: Recipe[]
}) {
  await ensureLocalSqliteMigrationReady()

  const ownerUserId = params.ownerUserId.trim()
  if (!ownerUserId) return

  const cloudRecipes = params.cloudRecipes
  const now = new Date().toISOString()
  const cloudIds = new Set(cloudRecipes.map((recipe) => recipe.id))
  const existingRows = await getAllAsync<LocalRecipeRow>(
    'SELECT * FROM local_recipes WHERE owner_user_id = ? OR owner_user_id IS NULL;',
    [ownerUserId]
  )

  const byCloudId = new Map<string, LocalRecipeRow>()
  for (const row of existingRows) {
    if (row.cloud_id) {
      byCloudId.set(row.cloud_id, row)
    }
  }

  for (const cloudRecipe of cloudRecipes) {
    const existing = byCloudId.get(cloudRecipe.id)
    if (existing) {
      if (existing.dirty === 1) continue

      await runSqlAsync(
        `UPDATE local_recipes
          SET
            title = ?,
            subtitle = ?,
            description = ?,
            emoji = ?,
            image_url = ?,
            steps_text = ?,
            ingredients_json = ?,
            folders_json = ?,
            prep_time_minutes = ?,
            cook_time_minutes = ?,
            servings = ?,
            created_at = ?,
            updated_at = ?,
            deleted_at = ?,
            owner_user_id = ?,
            cloud_id = ?,
            dirty = ?,
            last_synced_at = ?
          WHERE id = ?;`,
        [
          cloudRecipe.title,
          cloudRecipe.subtitle ?? null,
          cloudRecipe.description ?? null,
          cloudRecipe.emoji ?? null,
          cloudRecipe.imageUrl ?? null,
          serializeSteps(cloudRecipe.steps),
          serializeCloudIngredients(cloudRecipe),
          serializeCloudFolders(cloudRecipe),
          cloudRecipe.prepTimeMinutes ?? null,
          cloudRecipe.cookTimeMinutes ?? null,
          cloudRecipe.servings ?? null,
          cloudRecipe.createdAt ?? now,
          cloudRecipe.updatedAt ?? cloudRecipe.createdAt ?? now,
          null,
          ownerUserId,
          cloudRecipe.id,
          0,
          now,
          existing.id,
        ]
      )
      continue
    }

    const localId = `cloud_${cloudRecipe.id}`
    await runSqlAsync(
      `INSERT INTO local_recipes
        (
          id, title, subtitle, description, emoji, image_url, steps_text,
          ingredients_json, folders_json, prep_time_minutes, cook_time_minutes,
          servings, created_at, updated_at, deleted_at, owner_user_id, cloud_id,
          dirty, version, last_synced_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        localId,
        cloudRecipe.title,
        cloudRecipe.subtitle ?? null,
        cloudRecipe.description ?? null,
        cloudRecipe.emoji ?? null,
        cloudRecipe.imageUrl ?? null,
        serializeSteps(cloudRecipe.steps),
        serializeCloudIngredients(cloudRecipe),
        serializeCloudFolders(cloudRecipe),
        cloudRecipe.prepTimeMinutes ?? null,
        cloudRecipe.cookTimeMinutes ?? null,
        cloudRecipe.servings ?? null,
        cloudRecipe.createdAt ?? now,
        cloudRecipe.updatedAt ?? cloudRecipe.createdAt ?? now,
        null,
        ownerUserId,
        cloudRecipe.id,
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
      await runSqlAsync('DELETE FROM local_recipes WHERE id = ?;', [existing.id])
      await deleteRecipePdfAttachmentsForRecipe(existing.id)
    }
  }
}

export async function purgeLocalRecipeRow(localId: string) {
  await ensureLocalSqliteMigrationReady()
  await runSqlAsync('DELETE FROM local_recipes WHERE id = ?;', [localId])
}

export async function removeFolderFromLocalRecipesByName(folderName: string): Promise<number> {
  await ensureLocalSqliteMigrationReady()

  const normalizedFolderName = folderName.trim().toLowerCase()
  if (!normalizedFolderName) return 0

  const rows = await getAllAsync<LocalRecipeFoldersRow>(
    `SELECT id, folders_json, version
      FROM local_recipes
      WHERE deleted_at IS NULL;`
  )

  const now = new Date().toISOString()
  const statements: { sql: string; params?: (string | number | null)[] }[] = []

  for (const row of rows) {
    const folders = parseJsonArray<LocalRecipeFolder>(row.folders_json)
    const nextFolders = folders.filter(
      (folder) => folder.name.trim().toLowerCase() !== normalizedFolderName
    )
    if (nextFolders.length === folders.length) continue

    statements.push({
      sql: `UPDATE local_recipes
            SET folders_json = ?, updated_at = ?, dirty = ?, version = ?
            WHERE id = ?;`,
      params: [JSON.stringify(nextFolders), now, 1, (row.version ?? 1) + 1, row.id],
    })
  }

  if (statements.length === 0) return 0
  await runSqlBatchAsync(statements)
  return statements.length
}
