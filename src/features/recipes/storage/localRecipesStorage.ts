import AsyncStorage from '@react-native-async-storage/async-storage'

import type { RecipeFormSubmitValues } from '@/features/recipes/components/RecipeForm'
import { deleteRecipePdfAttachmentsForRecipe } from '@/features/recipes/storage/recipePdfStorage'

const STORAGE_KEY = 'recipes:local'

export type LocalRecipeIngredient = {
  id: string
  name: string
  quantity: string | null
  unit: string | null
  notes: string | null
  position: number
}

type LocalRecipeRow = {
  id: string
  title: string
  subtitle: string | null
  description: string | null
  emoji: string | null
  image_url: string | null
  steps_text: string | null
  ingredients: LocalRecipeIngredient[]
  folders: { id: string; name: string; emoji: string }[]
  prep_time_minutes: number | null
  cook_time_minutes: number | null
  servings: number | null
  created_at: string
  updated_at: string
  deleted_at?: string | null
  dirty?: number
  version?: number
  last_synced_at?: string | null
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
  folders: { id: string; name: string; emoji: string }[]
  prepTimeMinutes: number | null
  cookTimeMinutes: number | null
  servings: number | null
  createdAt: string
  updatedAt: string
}

function makeId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

async function readAll(): Promise<LocalRecipeRow[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as LocalRecipeRow[]
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

async function writeAll(recipes: LocalRecipeRow[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(recipes))
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

function toRecipeView(row: LocalRecipeRow): LocalRecipe {
  const legacyImageUrl =
    typeof (row as any).imageUrl === 'string' ? ((row as any).imageUrl as string) : null
  const legacySteps =
    Array.isArray((row as any).steps) ? ((row as any).steps as string[]) : null
  const legacyCreatedAt =
    typeof (row as any).createdAt === 'string' ? ((row as any).createdAt as string) : null
  const legacyUpdatedAt =
    typeof (row as any).updatedAt === 'string' ? ((row as any).updatedAt as string) : null

  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle ?? null,
    description: row.description ?? null,
    emoji: row.emoji ?? null,
    imageUrl: row.image_url ?? legacyImageUrl ?? null,
    steps: legacySteps ?? parseStepsText(row.steps_text),
    ingredients: row.ingredients ?? (Array.isArray((row as any).ingredients) ? (row as any).ingredients : []),
    folders: row.folders ?? (Array.isArray((row as any).folders) ? (row as any).folders : []),
    prepTimeMinutes: row.prep_time_minutes ?? (row as any).prepTimeMinutes ?? null,
    cookTimeMinutes: row.cook_time_minutes ?? (row as any).cookTimeMinutes ?? null,
    servings: row.servings ?? null,
    createdAt: row.created_at ?? legacyCreatedAt ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? legacyUpdatedAt ?? new Date().toISOString(),
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

function buildFolders(values: RecipeFormSubmitValues) {
  const list = values.folders ?? []
  return list
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => ({
      id: name.toLowerCase(),
      name,
      emoji: '📁',
    }))
}

export async function listLocalRecipes(): Promise<LocalRecipe[]> {
  const rows = await readAll()
  return rows.map(toRecipeView)
}

export async function getLocalRecipe(id: string): Promise<LocalRecipe | null> {
  const items = await readAll()
  const row = items.find((item) => item.id === id)
  return row ? toRecipeView(row) : null
}

export async function createLocalRecipe(
  values: RecipeFormSubmitValues
): Promise<LocalRecipe> {
  const now = new Date().toISOString()
  const recipe: LocalRecipeRow = {
    id: makeId(),
    title: values.title,
    subtitle: values.subtitle ?? null,
    description: values.description ?? null,
    emoji: values.emoji ?? null,
    image_url: values.imageUrl ?? null,
    steps_text: serializeSteps(values.steps),
    ingredients: buildIngredients(values),
    folders: buildFolders(values),
    prep_time_minutes: values.prepTimeMinutes ?? null,
    cook_time_minutes: values.cookTimeMinutes ?? null,
    servings: values.servings ?? null,
    created_at: now,
    updated_at: now,
    deleted_at: null,
    dirty: 1,
    version: 1,
    last_synced_at: null,
  }

  const items = await readAll()
  await writeAll([recipe, ...items])
  return toRecipeView(recipe)
}

export async function updateLocalRecipe(
  id: string,
  values: RecipeFormSubmitValues
): Promise<LocalRecipe> {
  const items = await readAll()
  const index = items.findIndex((item) => item.id === id)
  if (index < 0) throw new Error('Recipe not found')

  const existing = items[index]
  const next: LocalRecipeRow = {
    ...existing,
    title: values.title,
    subtitle: values.subtitle ?? null,
    description: values.description ?? null,
    emoji: values.emoji ?? null,
    image_url: values.imageUrl ?? null,
    steps_text: serializeSteps(values.steps),
    ingredients: buildIngredients(values),
    folders: buildFolders(values),
    prep_time_minutes: values.prepTimeMinutes ?? null,
    cook_time_minutes: values.cookTimeMinutes ?? null,
    servings: values.servings ?? null,
    updated_at: new Date().toISOString(),
    dirty: 1,
    version: (existing.version ?? 1) + 1,
  }

  const nextItems = [...items]
  nextItems[index] = next
  await writeAll(nextItems)
  return toRecipeView(next)
}

export async function deleteLocalRecipe(id: string): Promise<void> {
  const items = await readAll()
  const nextItems = items.filter((item) => item.id !== id)
  await writeAll(nextItems)
  await deleteRecipePdfAttachmentsForRecipe(id)
}
