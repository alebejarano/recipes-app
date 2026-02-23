import AsyncStorage from '@react-native-async-storage/async-storage'

import { createNote, deleteNoteById, listNotes, updateNote } from '@/features/notes/api/notesRepo'
import {
  listDirtyLocalNoteRowsForSync,
  markLocalNoteSynced,
  mergeCloudNotesIntoLocal,
  purgeLocalNoteRow,
  type LocalNoteSyncRow,
} from '@/features/notes/storage/localNotesStorage'
import { supabase } from '@/lib/supabase'

let syncInFlight: Promise<void> | null = null
const PLAN_KEY_PREFIX = 'subscription:plan:user:'

function toUpdateInput(row: LocalNoteSyncRow) {
  return {
    title: row.title ?? '',
    content: row.content ?? '',
    pinnedAt: row.pinnedAt ?? null,
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

async function runNoteSync() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error

  const userId = data.session?.user?.id
  if (!userId) return
  const plan = await AsyncStorage.getItem(`${PLAN_KEY_PREFIX}${userId}`)
  if (plan !== 'premium') return

  const dirtyRows = await listDirtyLocalNoteRowsForSync()

  for (const row of dirtyRows) {
    if (row.ownerUserId && row.ownerUserId !== userId) continue

    try {
      if (row.deletedAt) {
        if (row.cloudId) {
          try {
            await deleteNoteById(row.cloudId)
          } catch (deleteError) {
            if (!isDeleteAlreadyAppliedError(deleteError)) throw deleteError
          }
        }
        await purgeLocalNoteRow(row.id)
        continue
      }

      const input = toUpdateInput(row)
      if (row.cloudId) {
        await updateNote(row.cloudId, input)
        await markLocalNoteSynced({
          localId: row.id,
          ownerUserId: userId,
          cloudId: row.cloudId,
        })
      } else {
        const created = await createNote(input)
        await markLocalNoteSynced({
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
    const cloudNotes = await listNotes({ limit: 1000 })
    await mergeCloudNotesIntoLocal({
      ownerUserId: userId,
      cloudNotes,
    })
  } catch (pullError) {
    if (isConnectivityError(pullError)) return
    throw pullError
  }
}

export function triggerNoteSync() {
  if (syncInFlight) return syncInFlight

  syncInFlight = runNoteSync().finally(() => {
    syncInFlight = null
  })

  return syncInFlight
}
