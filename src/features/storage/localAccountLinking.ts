import AsyncStorage from '@react-native-async-storage/async-storage'

const RECIPES_KEY = 'recipes:local'
const NOTES_KEY = 'notes:local'
const FOLDERS_KEY = 'folders:local'

type AnyRow = Record<string, unknown>

function parseRows(raw: string | null): AnyRow[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as AnyRow[]) : []
  } catch {
    return []
  }
}

function toJson(rows: AnyRow[]) {
  return JSON.stringify(rows)
}

function claimRows(rows: AnyRow[], ownerUserId: string): { nextRows: AnyRow[]; claimedCount: number } {
  let claimedCount = 0

  const nextRows = rows.map((row) => {
    const existingOwner = typeof row.owner_user_id === 'string' ? row.owner_user_id : null
    if (existingOwner && existingOwner !== ownerUserId) {
      return row
    }
    if (existingOwner === ownerUserId) {
      return row
    }

    claimedCount += 1
    return {
      ...row,
      owner_user_id: ownerUserId,
    }
  })

  return { nextRows, claimedCount }
}

export async function tagLocalDataAsMigratable(ownerUserId: string) {
  const trimmedUserId = ownerUserId.trim()
  if (!trimmedUserId) return { recipes: 0, notes: 0, folders: 0 }

  const [recipesRaw, notesRaw, foldersRaw] = await Promise.all([
    AsyncStorage.getItem(RECIPES_KEY),
    AsyncStorage.getItem(NOTES_KEY),
    AsyncStorage.getItem(FOLDERS_KEY),
  ])

  const recipes = parseRows(recipesRaw)
  const notes = parseRows(notesRaw)
  const folders = parseRows(foldersRaw)

  const claimedRecipes = claimRows(recipes, trimmedUserId)
  const claimedNotes = claimRows(notes, trimmedUserId)
  const claimedFolders = claimRows(folders, trimmedUserId)

  await Promise.all([
    recipesRaw !== null
      ? AsyncStorage.setItem(RECIPES_KEY, toJson(claimedRecipes.nextRows))
      : Promise.resolve(),
    notesRaw !== null
      ? AsyncStorage.setItem(NOTES_KEY, toJson(claimedNotes.nextRows))
      : Promise.resolve(),
    foldersRaw !== null
      ? AsyncStorage.setItem(FOLDERS_KEY, toJson(claimedFolders.nextRows))
      : Promise.resolve(),
  ])

  return {
    recipes: claimedRecipes.claimedCount,
    notes: claimedNotes.claimedCount,
    folders: claimedFolders.claimedCount,
  }
}
