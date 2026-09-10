import AsyncStorage from '@react-native-async-storage/async-storage'
import type { CreateRecipeInput } from '@/features/recipes/api/recipesRepo'
import {
  createRecipe,
  deleteRecipeById,
  ensureCloudRecipeImageUrl,
  listRecipes,
  updateRecipe,
} from '@/features/recipes/api/recipesRepo'
import { uploadPremiumImport } from '@/features/recipes/api/importsRepo'
import {
  listDirtyLocalRecipeRowsForSync,
  listLocalRecipeRowsForImageRepair,
  mergeCloudRecipesIntoLocal,
  markLocalRecipeSynced,
  purgeLocalRecipeRow,
  type LocalRecipeSyncRow,
} from '@/features/recipes/storage/localRecipesStorage'
import {
  listDirtyLocalRecipeDocumentRowsForSync,
  markLocalRecipeDocumentSynced,
  recordLocalRecipeDocumentSyncFailure,
} from '@/features/recipes/storage/recipeDocumentStorage'
import { normalizeMealTimes } from '@/features/recipes/types/mealTimes'
import { supabase } from '@/lib/supabase'
import { getErrorCategory, logOperationalEvent } from '@/lib/productionLogger'

let syncInFlight: Promise<void> | null = null
const PLAN_KEY_PREFIX = 'subscription:plan:user:'

function parseStringList(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((item) => {
        if (typeof item === 'string') return item.trim()
        if (item && typeof item === 'object' && 'name' in item) {
          const value = (item as { name?: unknown }).name
          return typeof value === 'string' ? value.trim() : ''
        }
        return ''
      })
      .filter(Boolean)
  } catch {
    return []
  }
}

function inferImportMimeType(fileName: string) {
  const lower = fileName.trim().toLowerCase()
  if (lower.endsWith('.pdf')) return 'application/pdf'
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
  return 'application/octet-stream'
}

async function toCreateOrUpdateInput(row: LocalRecipeSyncRow): Promise<CreateRecipeInput> {
  return {
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    emoji: row.emoji,
    imageUrl: await ensureCloudRecipeImageUrl(row.imageUrl),
    ingredients: parseStringList(row.ingredientsJson),
    steps: row.stepsText
      ? row.stepsText
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
      : [],
    folders: parseStringList(row.foldersJson),
    mealTimes: normalizeMealTimes(parseStringList(row.mealTimesJson)),
    prepTimeMinutes: row.prepTimeMinutes,
    cookTimeMinutes: row.cookTimeMinutes,
    servings: row.servings,
  }
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const value = (error as { message?: unknown }).message
    if (typeof value === 'string') return value
  }
  return ''
}

function isConnectivityError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase()
  return (
    message.includes('network') ||
    message.includes('failed to fetch') ||
    message.includes('timed out') ||
    message.includes('timeout') ||
    message.includes('socket') ||
    message.includes('abort') ||
    message.includes('unknownhost') ||
    message.includes('unable to resolve host') ||
    message.includes('no address associated with hostname')
  )
}

function isDeleteAlreadyAppliedError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase()
  return message.includes('not found') || message.includes('no rows')
}

export type PendingImportSyncResult = {
  pendingCount: number
  syncedCount: number
  failedCount: number
}

/**
 * Uploads the actual bytes for locally queued imports. The strict mode is
 * used during a Premium upgrade so it cannot be reported as backed up until
 * every import has a cloud record and storage object.
 */
export async function syncPendingRecipeDocuments(
  userId: string,
  options: { throwOnFailure?: boolean } = {}
): Promise<PendingImportSyncResult> {
  const dirtyDocuments = (await listDirtyLocalRecipeDocumentRowsForSync()).filter(
    (document) => document.ownerUserId === userId
  )
  let syncedCount = 0
  let failedCount = 0

  if (dirtyDocuments.length > 0) {
    logOperationalEvent('sync_retry_started', {
      operation: 'sync_imports',
      entity: 'import',
      pending_count: dirtyDocuments.length,
    })
  }

  for (const document of dirtyDocuments) {
    try {
      const result = await uploadPremiumImport({
        uri: document.fileUri,
        fileName: document.fileName,
        mimeType: inferImportMimeType(document.fileName),
        title: document.title,
      })
      if (!result.document?.id) throw new Error('Import upload completed without a cloud document id.')

      await markLocalRecipeDocumentSynced({
        localId: document.id,
        ownerUserId: userId,
        cloudId: result.document.id,
      })
      syncedCount += 1
    } catch (error) {
      const duplicate = error as Error & {
        code?: string
        duplicate?: { id: string | null } | null
      }
      if (duplicate.code === 'duplicate_import' && duplicate.duplicate?.id) {
        await markLocalRecipeDocumentSynced({
          localId: document.id,
          ownerUserId: userId,
          cloudId: duplicate.duplicate.id,
        })
        syncedCount += 1
        continue
      }

      failedCount += 1
      await recordLocalRecipeDocumentSyncFailure({
        localId: document.id,
        message: getErrorMessage(error) || 'Import upload failed. Keep this file on this device and retry.',
      })
      if (isConnectivityError(error)) break
    }
  }

  const result = { pendingCount: dirtyDocuments.length, syncedCount, failedCount }
  if (failedCount > 0) {
    logOperationalEvent('sync_retry_failed', {
      operation: 'sync_imports',
      entity: 'import',
      pending_count: result.pendingCount,
      success_count: result.syncedCount,
      failure_count: result.failedCount,
    })
    if (options.throwOnFailure) {
      throw new Error(
        `${failedCount} import${failedCount === 1 ? '' : 's'} could not be backed up. Keep the file on this device and try again.`
      )
    }
  } else if (dirtyDocuments.length > 0) {
    logOperationalEvent('sync_retry_succeeded', {
      operation: 'sync_imports',
      entity: 'import',
      pending_count: result.pendingCount,
      success_count: result.syncedCount,
      failure_count: 0,
    })
  }

  return result
}

async function runRecipeSync() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error

  const userId = data.session?.user?.id
  if (!userId) return
  const plan = await AsyncStorage.getItem(`${PLAN_KEY_PREFIX}${userId}`)
  if (plan !== 'premium') return

  await syncPendingRecipeDocuments(userId)

  const dirtyRows = await listDirtyLocalRecipeRowsForSync()
  let recipeSyncSuccessCount = 0
  let recipeSyncFailureCount = 0
  if (dirtyRows.length > 0) {
    logOperationalEvent('sync_retry_started', {
      operation: 'sync_recipes',
      entity: 'recipe',
      pending_count: dirtyRows.length,
    })
  }

  for (const row of dirtyRows) {
    if (row.ownerUserId !== userId) continue

    try {
      if (row.deletedAt) {
        if (row.cloudId) {
          try {
            await deleteRecipeById(row.cloudId)
          } catch (deleteError) {
            if (!isDeleteAlreadyAppliedError(deleteError)) throw deleteError
          }
        }
        await purgeLocalRecipeRow(row.id)
        recipeSyncSuccessCount += 1
        continue
      }

      const input = await toCreateOrUpdateInput(row)
      if (row.cloudId) {
        await updateRecipe(row.cloudId, input)
        await markLocalRecipeSynced({
          localId: row.id,
          ownerUserId: userId,
          cloudId: row.cloudId,
        })
        recipeSyncSuccessCount += 1
      } else {
        const created = await createRecipe(input)
        await markLocalRecipeSynced({
          localId: row.id,
          ownerUserId: userId,
          cloudId: created.id,
        })
        recipeSyncSuccessCount += 1
      }
    } catch (rowError) {
      recipeSyncFailureCount += 1
      if (isConnectivityError(rowError)) {
        logOperationalEvent('sync_retry_failed', {
          operation: 'sync_recipes',
          entity: 'recipe',
          category: getErrorCategory(rowError),
          pending_count: dirtyRows.length,
          success_count: recipeSyncSuccessCount,
          failure_count: recipeSyncFailureCount,
        })
        return
      }
      // Keep dirty row for retry later; continue syncing other rows.
      continue
    }
  }
  if (dirtyRows.length > 0) {
    logOperationalEvent('sync_retry_succeeded', {
      operation: 'sync_recipes',
      entity: 'recipe',
      pending_count: dirtyRows.length,
      success_count: recipeSyncSuccessCount,
      failure_count: recipeSyncFailureCount,
    })
  }

  try {
    const cloudRecipes = await listRecipes({ limit: 1000 })
    const cloudById = new Map(cloudRecipes.map((recipe) => [recipe.id, recipe]))
    const repairCandidates = await listLocalRecipeRowsForImageRepair(userId)

    for (const row of repairCandidates) {
      if (!row.cloudId || !row.imageUrl) continue

      const normalizedImageUrl = row.imageUrl.trim()
      if (!normalizedImageUrl || /^https?:\/\//i.test(normalizedImageUrl)) continue

      const cloudRecipe = cloudById.get(row.cloudId)
      const cloudImageUrl = cloudRecipe?.imageUrl?.trim() ?? ''
      if (cloudImageUrl && /^https?:\/\//i.test(cloudImageUrl)) continue

      try {
        const repairedImageUrl = await ensureCloudRecipeImageUrl(normalizedImageUrl)
        if (!repairedImageUrl) continue

        await updateRecipe(row.cloudId, {
          title: row.title,
          subtitle: row.subtitle,
          description: row.description,
          emoji: row.emoji,
          imageUrl: repairedImageUrl,
          ingredients: parseStringList(row.ingredientsJson),
          steps: row.stepsText
            ? row.stepsText
                .split('\n')
                .map((line) => line.trim())
                .filter(Boolean)
            : [],
          folders: parseStringList(row.foldersJson),
          mealTimes: normalizeMealTimes(parseStringList(row.mealTimesJson)),
          prepTimeMinutes: row.prepTimeMinutes,
          cookTimeMinutes: row.cookTimeMinutes,
          servings: row.servings,
        })
      } catch {
        continue
      }
    }

    const refreshedCloudRecipes = await listRecipes({ limit: 1000 })
    await mergeCloudRecipesIntoLocal({
      ownerUserId: userId,
      cloudRecipes: refreshedCloudRecipes,
    })
  } catch (pullError) {
    if (isConnectivityError(pullError)) return
    throw pullError
  }
}

export function triggerRecipeSync() {
  if (syncInFlight) return syncInFlight

  syncInFlight = runRecipeSync()
    .catch((error) => {
      if (isConnectivityError(error)) {
        logOperationalEvent('sync_retry_failed', {
          operation: 'sync_recipes',
          entity: 'recipe',
          category: getErrorCategory(error),
        })
        return
      }
      logOperationalEvent('sync_retry_failed', {
        operation: 'sync_recipes',
        entity: 'recipe',
        category: getErrorCategory(error),
      })
    })
    .finally(() => {
      syncInFlight = null
    })

  return syncInFlight
}
