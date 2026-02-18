import { Directory, File, Paths } from 'expo-file-system'
import * as Sharing from 'expo-sharing'

export type ShareRecipeInput = {
  title: string
  subtitle?: string | null
  description?: string | null
  prepTimeMinutes?: number | null
  cookTimeMinutes?: number | null
  servings?: number | null
  ingredients?: { name: string }[]
  steps?: string[]
  folders?: { name: string }[]
}

const SHARED_RECIPES_DIR = new Directory(Paths.cache, 'shared-recipes')

function normalizeLine(value?: string | null) {
  return value?.trim() ?? ''
}

function safeFileName(input: string) {
  const normalized = input.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, '-')
  const collapsed = normalized.replace(/-+/g, '-').replace(/^-|-$/g, '')
  return collapsed || 'recipe'
}

export function buildRecipeShareText(recipe: ShareRecipeInput) {
  const lines: string[] = []
  const title = normalizeLine(recipe.title) || 'Recipe'
  const subtitle = normalizeLine(recipe.subtitle)
  const description = normalizeLine(recipe.description)
  const folders = recipe.folders?.map((folder) => normalizeLine(folder.name)).filter(Boolean) ?? []

  lines.push(title)
  if (subtitle) lines.push(subtitle)

  const meta: string[] = []
  if (recipe.prepTimeMinutes) meta.push(`Prep: ${recipe.prepTimeMinutes} min`)
  if (recipe.cookTimeMinutes) meta.push(`Cook: ${recipe.cookTimeMinutes} min`)
  if (recipe.servings) meta.push(`Servings: ${recipe.servings}`)
  if (meta.length > 0) {
    lines.push('')
    lines.push(meta.join(' | '))
  }

  if (folders.length > 0) {
    lines.push('')
    lines.push(`Folders: ${folders.join(', ')}`)
  }

  const ingredients = recipe.ingredients?.map((item) => normalizeLine(item.name)).filter(Boolean) ?? []
  if (ingredients.length > 0) {
    lines.push('')
    lines.push('Ingredients')
    ingredients.forEach((ingredient) => {
      lines.push(`- ${ingredient}`)
    })
  }

  const steps = recipe.steps?.map((step) => normalizeLine(step)).filter(Boolean) ?? []
  if (steps.length > 0) {
    lines.push('')
    lines.push('Instructions')
    steps.forEach((step, index) => {
      lines.push(`${index + 1}. ${step}`)
    })
  }

  if (description) {
    lines.push('')
    lines.push('Notes')
    lines.push(description)
  }

  return lines.join('\n')
}

export async function shareRecipeAsTextFile(recipe: ShareRecipeInput) {
  const available = await Sharing.isAvailableAsync()
  if (!available) {
    throw new Error('Sharing is not available on this device.')
  }

  if (!SHARED_RECIPES_DIR.exists) {
    SHARED_RECIPES_DIR.create({ intermediates: true, idempotent: true })
  }

  const text = buildRecipeShareText(recipe)
  const fileName = `${safeFileName(recipe.title)}-${Date.now()}.txt`
  const file = new File(SHARED_RECIPES_DIR, fileName)
  file.create({ intermediates: true, overwrite: true })
  file.write(text)

  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/plain',
    dialogTitle: 'Share recipe',
    UTI: 'public.plain-text',
  })
}
