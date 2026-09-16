import { Directory, File, Paths } from '@/lib/fileSystem'
import { Platform } from 'react-native'

const RECIPE_COVERS_DIR = new Directory(Paths.document, 'recipe-cover-images')
const RECIPE_COVERS_BASE_URI = RECIPE_COVERS_DIR.uri.endsWith('/')
  ? RECIPE_COVERS_DIR.uri
  : `${RECIPE_COVERS_DIR.uri}/`

function buildDestinationPath(name: string) {
  const safeName = name.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `${RECIPE_COVERS_BASE_URI}${Date.now()}_${safeName || 'recipe.jpg'}`
}

async function ensureRecipeCoversDir() {
  if (Platform.OS === 'web' || RECIPE_COVERS_DIR.exists) return
  RECIPE_COVERS_DIR.create({ intermediates: true, idempotent: true })
}

export function isManagedLocalRecipeCoverUri(uri: string | null | undefined) {
  return Boolean(uri?.startsWith(RECIPE_COVERS_BASE_URI))
}

export async function copyLocalRecipeCover(input: { uri: string; name: string }): Promise<string> {
  if (Platform.OS === 'web') return input.uri

  await ensureRecipeCoversDir()
  const destination = buildDestinationPath(input.name)
  new File(input.uri).copy(new File(destination))
  return destination
}

export async function removeLocalRecipeCover(uri: string): Promise<void> {
  if (!isManagedLocalRecipeCoverUri(uri) || Platform.OS === 'web') return

  try {
    const file = new File(uri)
    if (file.exists) file.delete()
  } catch {
    // A missing local cache must not prevent the recipe update from completing.
  }
}
