// src/features/recipes/api/recipesRepo.ts
import { fetch } from 'expo/fetch'
import { supabase } from '@/lib/supabase'
import type { RecipeFormSubmitValues } from '../components/RecipeForm'

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
  tags: string[]

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

type RecipeRow = {
  id: string
  user_id: string
  title: string
  subtitle: string | null
  description: string | null
  emoji: string | null
  image_url: string | null
  steps_text: string | null
  tags: string[] | null
  prep_time_minutes: number | null
  cook_time_minutes: number | null
  servings: number | null
  created_at: string
  updated_at: string
  recipe_ingredients?: RecipeIngredientRow[] | null
}

type RecipeIngredientRow = {
  id: string
  name: string
  quantity: string | null
  unit: string | null
  notes: string | null
  position: number
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

function mapRecipe(row: RecipeRow): Recipe {
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
    tags: row.tags ?? [],
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

export async function uploadRecipeImage(input: UploadRecipeImageInput): Promise<string> {
  const user = await requireAuth()
  const fileName = input.fileName?.trim() || input.uri.split('/').pop() || 'recipe.jpg'
  const ext = fileName.includes('.') ? fileName.split('.').pop() : 'jpg'
  const path = `${user.id}/${Date.now()}.${ext}`

  const response = await fetch(input.uri)
  const arrayBuffer = await response.arrayBuffer()
  const bytes = new Uint8Array(arrayBuffer)

  const { error: uploadError } = await supabase.storage
    .from(RECIPE_IMAGES_BUCKET)
    .upload(path, bytes, {
      contentType: input.mimeType ?? 'image/jpeg',
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
      steps_text: serializeSteps(input.steps),
      tags: input.tags,
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
      steps_text,
      tags,
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

  return mapRecipe(data as RecipeRow)
}

export async function getRecipeById(id: string): Promise<Recipe> {
  const { data, error } = await supabase
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
      steps_text,
      tags,
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
      )
    `
    )
    .eq('id', id)
    .single()

  if (error) throw error
  if (!data) throw new Error('Recipe not found')

  return mapRecipe(data as RecipeRow)
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
      steps_text,
      tags,
      prep_time_minutes,
      cook_time_minutes,
      servings,
      created_at,
      updated_at
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

  return (data ?? []).map((row) => mapRecipe(row as RecipeRow))
}

export type RecipeTagSuggestion = { label: string; count: number }

export async function listRecipeTags(): Promise<RecipeTagSuggestion[]> {
  const { data, error } = await supabase.from('recipes').select('tags')
  if (error) throw error

  const map = new Map<string, { label: string; count: number }>()
  for (const row of data ?? []) {
    const tags = (row as { tags: string[] | null }).tags ?? []
    for (const tag of tags) {
      const trimmed = tag.trim()
      if (!trimmed) continue
      const key = trimmed.toLowerCase()
      const existing = map.get(key)
      if (existing) {
        existing.count += 1
      } else {
        map.set(key, { label: trimmed, count: 1 })
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count
    return a.label.localeCompare(b.label)
  })
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
      steps_text: serializeSteps(input.steps),
      tags: input.tags,
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
      steps_text,
      tags,
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

export async function deleteRecipeById(id: string): Promise<void> {
  await requireAuth()
  const { error } = await supabase.from('recipes').delete().eq('id', id)
  if (error) throw error
}
