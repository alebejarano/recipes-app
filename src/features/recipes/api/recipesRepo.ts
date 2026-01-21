// src/features/recipes/api/recipesRepo.ts
import { supabase } from '@/lib/supabase'
import type { RecipeFormSubmitValues } from '../components/RecipeForm'

/**
 * Option A data model:
 * - ingredients_text and steps_text are stored directly on `recipes`
 * - no child tables for ingredients/steps
 */

export type Recipe = {
  id: string
  userId: string

  title: string
  subtitle: string | null
  description: string | null

  ingredientsText: string | null
  stepsText: string | null

  prepTimeMinutes: number | null
  cookTimeMinutes: number | null
  servings: number | null

  createdAt: string
  updatedAt: string
}

type RecipeRow = {
  id: string
  user_id: string
  title: string
  subtitle: string | null
  description: string | null
  ingredients_text: string | null
  steps_text: string | null
  prep_time_minutes: number | null
  cook_time_minutes: number | null
  servings: number | null
  created_at: string
  updated_at: string
}

function mapRecipe(row: RecipeRow): Recipe {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    ingredientsText: row.ingredients_text,
    stepsText: row.steps_text,
    prepTimeMinutes: row.prep_time_minutes,
    cookTimeMinutes: row.cook_time_minutes,
    servings: row.servings,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export type CreateRecipeInput = RecipeFormSubmitValues
export type UpdateRecipeInput = RecipeFormSubmitValues

export async function createRecipe(input: CreateRecipeInput): Promise<Recipe> {
  const { data, error } = await supabase
    .from('recipes')
    .insert({
      title: input.title,
      subtitle: input.subtitle,
      description: input.description,
      ingredients_text: input.ingredientsText,
      steps_text: input.stepsText,
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
      ingredients_text,
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
      ingredients_text,
      steps_text,
      prep_time_minutes,
      cook_time_minutes,
      servings,
      created_at,
      updated_at
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
      ingredients_text,
      steps_text,
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

export async function updateRecipe(id: string, input: UpdateRecipeInput): Promise<Recipe> {
  const { data, error } = await supabase
    .from('recipes')
    .update({
      title: input.title,
      subtitle: input.subtitle,
      description: input.description,
      ingredients_text: input.ingredientsText,
      steps_text: input.stepsText,
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
      ingredients_text,
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

  return mapRecipe(data as RecipeRow)
}

export async function deleteRecipeById(id: string): Promise<void> {
  const { error } = await supabase.from('recipes').delete().eq('id', id)
  if (error) throw error
}
