// src/features/recipes/api/recipesRepo.ts
import { fetch } from 'expo/fetch'
import { supabase } from '@/lib/supabase'
import {
  IMPORT_ALLOWED_IMAGE_MIME_TYPES,
  RECIPE_IMAGE_MASTER_MAX_FILE_BYTES,
  RECIPE_IMAGE_MASTER_TOO_LARGE_MESSAGE,
} from '@/features/subscription/constants/limits'
import {
  normalizeMealTimes,
  resolveMealTimes,
  type RecipeMealTime,
} from '@/features/recipes/types/mealTimes'
import type { RecipeFormSubmitValues } from '../components/RecipeForm'

const REQUEST_TIMEOUT_MS = 10000

function withTimeout<T>(promiseLike: PromiseLike<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    Promise.resolve(promiseLike),
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms)
    }),
  ])
}

async function requireAuth() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  if (!data.session?.user) throw new Error('Not authenticated')
  return data.session.user
}

export type Recipe = {
  id: string
  userId: string

  title: string
  subtitle: string | null
  description: string | null
  emoji: string | null
  imageUrl: string | null

  ingredients: RecipeIngredient[]
  steps: string[]
  folders: RecipeFolder[]
  mealTimes: RecipeMealTime[]
  mealTimesInferred?: boolean

  prepTimeMinutes: number | null
  cookTimeMinutes: number | null
  servings: number | null

  createdAt: string
  updatedAt: string
}

export type RecipeIngredient = {
  id: string
  name: string
  quantity: string | null
  unit: string | null
  notes: string | null
  position: number
}

export type RecipeFolder = {
  id: string
  name: string
  emoji: string
}

type RecipeRow = {
  id: string
  user_id: string
  title: string
  subtitle: string | null
  description: string | null
  emoji: string | null
  image_url: string | null
  steps_text: string | null
  prep_time_minutes: number | null
  cook_time_minutes: number | null
  servings: number | null
  created_at: string
  updated_at: string
  recipe_ingredients?: RecipeIngredientRow[] | null
  recipe_folders?: RecipeFolderJoinRow[] | null
  meal_times?: string[] | null
}

type RecipeIngredientRow = {
  id: string
  name: string
  quantity: string | null
  unit: string | null
  notes: string | null
  position: number
}

type RecipeFolderJoinRow = {
  folder: RecipeFolderRow | RecipeFolderRow[] | null
}

type RecipeFolderRow = {
  id: string
  name: string
  emoji: string | null
}

function mapIngredients(rows: RecipeIngredientRow[] | null | undefined): RecipeIngredient[] {
  if (!rows || rows.length === 0) return []
  return rows
    .map((row) => ({
      id: row.id,
      name: row.name,
      quantity: row.quantity ?? null,
      unit: row.unit ?? null,
      notes: row.notes ?? null,
      position: row.position ?? 0,
    }))
    .sort((a, b) => a.position - b.position)
}

function mapFolders(rows: RecipeFolderJoinRow[] | null | undefined): RecipeFolder[] {
  if (!rows || rows.length === 0) return []
  return rows
    .map((row) => {
      const folder = row.folder
      if (Array.isArray(folder)) return folder[0] ?? null
      return folder
    })
    .filter((folder): folder is RecipeFolderRow => Boolean(folder))
    .map((folder) => ({
      id: folder.id,
      name: folder.name,
      emoji: folder.emoji ?? '📁',
    }))
}

function parseStepsText(value: string | null): string[] {
  if (!value) return []
  const trimmed = value.trim()
  if (!trimmed) return []
  const lines = trimmed
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  return lines.length ? lines : [trimmed]
}

function serializeSteps(steps: string[] | null | undefined): string | null {
  if (!steps) return null
  const normalized = steps.map((step) => step.trim()).filter(Boolean)
  return normalized.length ? normalized.join('\n') : null
}

function resolveRecipeMealTimes(input: {
  mealTimes?: readonly string[] | null
  title?: string | null
  subtitle?: string | null
  folders?: { name: string }[] | null
}): RecipeMealTime[] {
  return resolveMealTimes(input.mealTimes, {
    title: input.title,
    subtitle: input.subtitle,
    folders: input.folders,
  })
}

async function backfillRecipeMealTimesIfNeeded(
  recipe: Recipe,
  hadExplicitMealTimes = false
) {
  const inferredMealTimes = resolveRecipeMealTimes(recipe)
  if (hadExplicitMealTimes || inferredMealTimes.length === 0) {
    return recipe
  }

  recipe.mealTimes = inferredMealTimes
  recipe.mealTimesInferred = true

  try {
    await supabase
      .from('recipes')
      .update({ meal_times: inferredMealTimes })
      .eq('id', recipe.id)
  } catch {
    // Keep the inferred meal times in memory even if persistence fails.
  }

  return recipe
}

function mapRecipe(row: RecipeRow): Recipe {
  const folders = mapFolders(row.recipe_folders)
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    emoji: row.emoji ?? null,
    imageUrl: row.image_url ?? null,
    ingredients: mapIngredients(row.recipe_ingredients),
    steps: parseStepsText(row.steps_text),
    folders,
    mealTimes: normalizeMealTimes(row.meal_times),
    mealTimesInferred: false,
    prepTimeMinutes: row.prep_time_minutes,
    cookTimeMinutes: row.cook_time_minutes,
    servings: row.servings,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export type CreateRecipeInput = RecipeFormSubmitValues
export type UpdateRecipeInput = RecipeFormSubmitValues

type UploadRecipeImageInput = {
  uri: string
  fileName?: string | null
  mimeType?: string | null
}

const RECIPE_IMAGES_BUCKET = 'recipe-images'
const ALLOWED_IMAGE_MIME_TYPES = new Set<string>(IMPORT_ALLOWED_IMAGE_MIME_TYPES)

export async function uploadRecipeImage(input: UploadRecipeImageInput): Promise<string> {
  const user = await requireAuth()
  const fileName = input.fileName?.trim() || input.uri.split('/').pop() || 'recipe.jpg'
  const ext = fileName.includes('.') ? fileName.split('.').pop() : 'jpg'
  const path = `${user.id}/${Date.now()}.${ext}`

  const response = await fetch(input.uri)
  const arrayBuffer = await response.arrayBuffer()
  const bytes = new Uint8Array(arrayBuffer)
  const normalizedMimeType = (input.mimeType ?? 'image/jpeg').toLowerCase()
  if (!ALLOWED_IMAGE_MIME_TYPES.has(normalizedMimeType)) {
    throw new Error('Unsupported file type. Use JPG or PNG.')
  }
  if (bytes.byteLength > RECIPE_IMAGE_MASTER_MAX_FILE_BYTES) {
    throw new Error(RECIPE_IMAGE_MASTER_TOO_LARGE_MESSAGE)
  }

  const { error: uploadError } = await supabase.storage
    .from(RECIPE_IMAGES_BUCKET)
    .upload(path, bytes, {
      contentType: normalizedMimeType,
      upsert: false,
    })

  if (uploadError) throw uploadError

  const { data } = supabase.storage.from(RECIPE_IMAGES_BUCKET).getPublicUrl(path)
  if (!data?.publicUrl) throw new Error('Unable to get image URL')

  return data.publicUrl
}

export async function createRecipe(input: CreateRecipeInput): Promise<Recipe> {
  const user = await requireAuth()
  const { data, error } = await supabase
    .from('recipes')
    .insert({
      user_id: user.id,
      title: input.title,
      subtitle: input.subtitle,
      description: input.description,
      emoji: input.emoji,
      image_url: input.imageUrl,
      meal_times: resolveRecipeMealTimes({
        mealTimes: input.mealTimes,
        title: input.title,
        subtitle: input.subtitle,
        folders: (input.folders ?? []).map((name) => ({ name })),
      }),
      steps_text: serializeSteps(input.steps),
      prep_time_minutes: input.prepTimeMinutes,
      cook_time_minutes: input.cookTimeMinutes,
      servings: input.servings,
    })
    .select(
      `
      id,
      user_id,
      title,
      subtitle,
      description,
      emoji,
      image_url,
      meal_times,
      steps_text,
      prep_time_minutes,
      cook_time_minutes,
      servings,
      created_at,
      updated_at
    `
    )
    .single()

  if (error) throw error
  if (!data) throw new Error('Create recipe failed')

  const recipe = mapRecipe(data as RecipeRow)

  if (input.folders && input.folders.length > 0) {
    const folderIds = await getOrCreateFolderIds(input.folders, user.id)
    if (folderIds.length > 0) {
      const { error: folderError } = await supabase.from('recipe_folders').insert(
        folderIds.map((folderId) => ({
          recipe_id: recipe.id,
          folder_id: folderId,
        }))
      )
      if (folderError) throw folderError
    }
  }

  if (input.ingredients && input.ingredients.length > 0) {
    const { error: ingredientError } = await supabase.from('recipe_ingredients').insert(
      input.ingredients.map((name, index) => ({
        recipe_id: recipe.id,
        name,
        position: index + 1,
      }))
    )

    if (ingredientError) throw ingredientError
  }

  return getRecipeById(recipe.id)
}

export async function getRecipeById(id: string): Promise<Recipe> {
  const trimmedId = id.trim()
  if (!trimmedId) throw new Error('Missing recipe id')

  const { data, error } = await withTimeout(
    supabase
      .from('recipes')
      .select(
        `
        id,
        user_id,
        title,
        subtitle,
        description,
        emoji,
        image_url,
        meal_times,
        steps_text,
        prep_time_minutes,
        cook_time_minutes,
        servings,
        created_at,
        updated_at,
        recipe_ingredients:recipe_ingredients (
          id,
          name,
          quantity,
          unit,
          notes,
          position
        ),
        recipe_folders:recipe_folders (
          folder:folders (
            id,
            name,
            emoji
          )
        )
      `
      )
      .eq('id', trimmedId)
      .single(),
    REQUEST_TIMEOUT_MS,
    'Recipe request timed out'
  )

  if (error) throw error
  if (!data) throw new Error('Recipe not found')

  const recipeRow = data as RecipeRow
  return backfillRecipeMealTimesIfNeeded(
    mapRecipe(recipeRow),
    normalizeMealTimes(recipeRow.meal_times).length > 0
  )
}

/**
 * Optional helper if you want a list screen soon.
 */
export async function listRecipes(params?: {
  limit?: number
  search?: string
}): Promise<Recipe[]> {
  const limit = params?.limit ?? 50
  const search = params?.search?.trim()

  let query = supabase
    .from('recipes')
    .select(
      `
      id,
      user_id,
      title,
      subtitle,
      description,
      emoji,
      image_url,
      meal_times,
      steps_text,
      prep_time_minutes,
      cook_time_minutes,
      servings,
      created_at,
      updated_at,
      recipe_ingredients:recipe_ingredients (
        id,
        name,
        quantity,
        unit,
        notes,
        position
      ),
      recipe_folders:recipe_folders (
        folder:folders (
          id,
          name,
          emoji
        )
      )
    `
    )
    .order('updated_at', { ascending: false })
    .limit(limit)

  // Lightweight search on title (can be improved later with full-text search)
  if (search) {
    query = query.ilike('title', `%${search}%`)
  }

  const { data, error } = await query
  if (error) throw error

  return Promise.all(
    (data ?? []).map((row) => {
      const recipeRow = row as RecipeRow
      return backfillRecipeMealTimesIfNeeded(
        mapRecipe(recipeRow),
        normalizeMealTimes(recipeRow.meal_times).length > 0
      )
    })
  )
}

export type RecipeTagSuggestion = { label: string; count: number }

export async function listRecipeTags(): Promise<RecipeTagSuggestion[]> {
  return []
}

export async function updateRecipe(id: string, input: UpdateRecipeInput): Promise<Recipe> {
  await requireAuth()
  const { data, error } = await supabase
    .from('recipes')
    .update({
      title: input.title,
      subtitle: input.subtitle,
      description: input.description,
      emoji: input.emoji,
      image_url: input.imageUrl,
      meal_times: resolveRecipeMealTimes({
        mealTimes: input.mealTimes,
        title: input.title,
        subtitle: input.subtitle,
        folders: (input.folders ?? []).map((name) => ({ name })),
      }),
      steps_text: serializeSteps(input.steps),
      prep_time_minutes: input.prepTimeMinutes,
      cook_time_minutes: input.cookTimeMinutes,
      servings: input.servings,
    })
    .eq('id', id)
    .select(
      `
      id,
      user_id,
      title,
      subtitle,
      description,
      emoji,
      image_url,
      meal_times,
      steps_text,
      prep_time_minutes,
      cook_time_minutes,
      servings,
      created_at,
      updated_at
    `
    )
    .single()

  if (error) throw error
  if (!data) throw new Error('Update recipe failed')

  if (input.folders) {
    const { error: deleteError } = await supabase
      .from('recipe_folders')
      .delete()
      .eq('recipe_id', id)

    if (deleteError) throw deleteError

    if (input.folders.length > 0) {
      const user = await requireAuth()
      const folderIds = await getOrCreateFolderIds(input.folders, user.id)
      if (folderIds.length > 0) {
        const { error: folderError } = await supabase
          .from('recipe_folders')
          .insert(
            folderIds.map((folderId) => ({
              recipe_id: id,
              folder_id: folderId,
            }))
          )
        if (folderError) throw folderError
      }
    }
  }

  if (input.ingredients) {
    const { error: deleteError } = await supabase
      .from('recipe_ingredients')
      .delete()
      .eq('recipe_id', id)

    if (deleteError) throw deleteError

    if (input.ingredients.length > 0) {
      const { error: ingredientError } = await supabase
        .from('recipe_ingredients')
        .insert(
          input.ingredients.map((name, index) => ({
            recipe_id: id,
            name,
            position: index + 1,
          }))
        )

      if (ingredientError) throw ingredientError
    }
  }

  return mapRecipe(data as RecipeRow)
}

async function getOrCreateFolderIds(names: string[], userId: string): Promise<string[]> {
  const trimmed = Array.from(
    new Set(names.map((name) => name.trim()).filter(Boolean))
  )
  if (trimmed.length === 0) return []

  const { data: existing, error: listError } = await supabase
    .from('folders')
    .select('id,name,emoji')
    .eq('user_id', userId)

  if (listError) throw listError

  const map = new Map<string, string>()
  for (const folder of (existing ?? []) as RecipeFolderRow[]) {
    const key = folder.name.trim().toLowerCase()
    if (!key || map.has(key)) continue
    map.set(key, folder.id)
  }

  const missing = trimmed.filter((name) => !map.has(name.toLowerCase()))
  if (missing.length > 0) {
    const { data: inserted, error: insertError } = await supabase
      .from('folders')
      .insert(missing.map((name) => ({ user_id: userId, name, emoji: '📁' })))
      .select('id,name,emoji')

    if (insertError) throw insertError
    for (const folder of (inserted ?? []) as RecipeFolderRow[]) {
      map.set(folder.name.toLowerCase(), folder.id)
    }
  }

  return trimmed.map((name) => map.get(name.toLowerCase())).filter(Boolean) as string[]
}

export async function deleteRecipeById(id: string): Promise<void> {
  await requireAuth()
  const { error } = await supabase.from('recipes').delete().eq('id', id)
  if (error) throw error
}
