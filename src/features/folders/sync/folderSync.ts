import AsyncStorage from '@react-native-async-storage/async-storage'

import {
  createFolder,
  deleteFolderWithRecipes,
  listFolders,
  reconcileDuplicateFavoriteFolders,
  updateFolder,
} from '@/features/folders/api/foldersCloudRepo'
import {
  listDirtyLocalFolderRowsForSync,
  dedupeLocalFoldersByName,
  markLocalFolderSynced,
  mergeCloudFoldersIntoLocal,
  purgeLocalFolderRow,
  type LocalFolderSyncRow,
} from '@/features/folders/storage/localFoldersStorage'
import { supabase } from '@/lib/supabase'
import { getErrorCategory, logOperationalEvent } from '@/lib/productionLogger'

let syncInFlight: Promise<void> | null = null
const PLAN_KEY_PREFIX = 'subscription:plan:user:'

function toUpdateInput(row: LocalFolderSyncRow) {
  return {
    name: row.name,
    emoji: row.emoji ?? '📁',
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

function normalizeFolderName(name: string) {
  return name.trim().toLocaleLowerCase()
}

async function runFolderSync() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error

  const userId = data.session?.user?.id
  if (!userId) return
  const plan = await AsyncStorage.getItem(`${PLAN_KEY_PREFIX}${userId}`)
  if (plan !== 'premium') return

  let cloudFolders = await reconcileDuplicateFavoriteFolders(await listFolders())
  const cloudFolderByName = new Map(
    cloudFolders.map((folder) => [normalizeFolderName(folder.name), folder])
  )
  const dirtyRows = await listDirtyLocalFolderRowsForSync()

  for (const row of dirtyRows) {
    if (row.ownerUserId !== userId) continue

    try {
      if (row.deletedAt) {
        if (row.cloudId) {
          try {
            await deleteFolderWithRecipes({ id: row.cloudId })
          } catch (deleteError) {
            if (!isDeleteAlreadyAppliedError(deleteError)) throw deleteError
          }
        }
        await purgeLocalFolderRow(row.id)
        continue
      }

      const input = toUpdateInput(row)
      if (row.cloudId) {
        await updateFolder({
          id: row.cloudId,
          name: input.name,
          emoji: input.emoji,
        })
        await markLocalFolderSynced({
          localId: row.id,
          ownerUserId: userId,
          cloudId: row.cloudId,
        })
      } else {
        const matchingCloudFolder = cloudFolderByName.get(normalizeFolderName(input.name))
        if (matchingCloudFolder) {
          await markLocalFolderSynced({
            localId: row.id,
            ownerUserId: userId,
            cloudId: matchingCloudFolder.id,
          })
          continue
        }
        const created = await createFolder({
          name: input.name,
          emoji: input.emoji,
        })
        await markLocalFolderSynced({
          localId: row.id,
          ownerUserId: userId,
          cloudId: created.id,
        })
        cloudFolderByName.set(normalizeFolderName(created.name), created)
      }
    } catch (rowError) {
      if (isConnectivityError(rowError)) return
      continue
    }
  }

  try {
    cloudFolders = await reconcileDuplicateFavoriteFolders(await listFolders())
    await mergeCloudFoldersIntoLocal({
      ownerUserId: userId,
      cloudFolders,
    })
    await dedupeLocalFoldersByName(userId)
  } catch (pullError) {
    if (isConnectivityError(pullError)) return
    throw pullError
  }
}

export function triggerFolderSync() {
  if (syncInFlight) return syncInFlight

  syncInFlight = runFolderSync()
    .catch((error) => {
      logOperationalEvent('sync_retry_failed', {
        operation: 'sync_folders',
        entity: 'folder',
        category: getErrorCategory(error),
      })
    })
    .finally(() => {
      syncInFlight = null
    })

  return syncInFlight
}
