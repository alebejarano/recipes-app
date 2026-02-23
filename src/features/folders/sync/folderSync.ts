import AsyncStorage from '@react-native-async-storage/async-storage'

import {
  createFolder,
  deleteFolderWithRecipes,
  listFolders,
  updateFolder,
} from '@/features/folders/api/foldersCloudRepo'
import {
  listDirtyLocalFolderRowsForSync,
  markLocalFolderSynced,
  mergeCloudFoldersIntoLocal,
  purgeLocalFolderRow,
  type LocalFolderSyncRow,
} from '@/features/folders/storage/localFoldersStorage'
import { supabase } from '@/lib/supabase'

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
    message.includes('socket')
  )
}

function isDeleteAlreadyAppliedError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase()
  return message.includes('not found') || message.includes('no rows')
}

async function runFolderSync() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error

  const userId = data.session?.user?.id
  if (!userId) return
  const plan = await AsyncStorage.getItem(`${PLAN_KEY_PREFIX}${userId}`)
  if (plan !== 'premium') return

  const dirtyRows = await listDirtyLocalFolderRowsForSync()

  for (const row of dirtyRows) {
    if (row.ownerUserId && row.ownerUserId !== userId) continue

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
        const created = await createFolder({
          name: input.name,
          emoji: input.emoji,
        })
        await markLocalFolderSynced({
          localId: row.id,
          ownerUserId: userId,
          cloudId: created.id,
        })
      }
    } catch (rowError) {
      if (isConnectivityError(rowError)) return
      continue
    }
  }

  try {
    const cloudFolders = await listFolders()
    await mergeCloudFoldersIntoLocal({
      ownerUserId: userId,
      cloudFolders,
    })
  } catch (pullError) {
    if (isConnectivityError(pullError)) return
    throw pullError
  }
}

export function triggerFolderSync() {
  if (syncInFlight) return syncInFlight

  syncInFlight = runFolderSync().finally(() => {
    syncInFlight = null
  })

  return syncInFlight
}
