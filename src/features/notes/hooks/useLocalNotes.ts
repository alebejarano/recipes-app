import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useAnalyticsCapture } from '@/features/analytics/events'
import { useAuth } from '@/features/auth/context/AuthContext'
import type { LocalNote } from '@/features/notes/storage/localNotesStorage'
import {
  createLocalNote,
  deleteLocalNote,
  getLocalNote,
  getLocalNoteByIdOrCloudId,
  listLocalNotes,
  updateLocalNote,
} from '@/features/notes/storage/localNotesStorage'
import { triggerNoteSync } from '@/features/notes/sync/noteSync'

const LIST_KEY = ['notes', 'local', 'list']
type LocalNotesListParams = {
  limit?: number
  search?: string
  enabled?: boolean
}

export function useLocalNotesList(params?: LocalNotesListParams) {
  const { user } = useAuth()
  return useQuery<LocalNote[]>({
    queryKey: [...LIST_KEY, user?.id ?? 'guest', params?.limit ?? 200, params?.search ?? ''],
    queryFn: () => listLocalNotes(params),
    enabled: params?.enabled ?? true,
  })
}

export function useLocalNote(id: string, options?: { enabled?: boolean; matchCloudId?: boolean }) {
  const { user } = useAuth()
  return useQuery<LocalNote | null>({
    queryKey: ['notes', 'local', 'detail', user?.id ?? 'guest', options?.matchCloudId ? 'any' : 'id', id],
    queryFn: () => options?.matchCloudId ? getLocalNoteByIdOrCloudId(id) : getLocalNote(id),
    enabled: Boolean(id) && (options?.enabled ?? true),
  })
}

export function useCreateLocalNote() {
  const qc = useQueryClient()
  const captureAnalyticsEvent = useAnalyticsCapture()
  return useMutation({
    mutationFn: (input: { title: string; content: string; pinnedAt?: string | null }) =>
      createLocalNote(input),
    onSuccess: () => {
      captureAnalyticsEvent('note_created', {
        storage_mode: 'local',
      })
      qc.invalidateQueries({ queryKey: LIST_KEY })
      void triggerNoteSync()
    },
  })
}

export function useUpdateLocalNote(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { title?: string; content?: string; pinnedAt?: string | null }) =>
      updateLocalNote(id, input),
    onSuccess: (note) => {
      qc.setQueryData(['notes', 'local', 'detail', 'id', id], note)
      qc.setQueryData(['notes', 'local', 'detail', 'any', id], note)
      qc.invalidateQueries({ queryKey: LIST_KEY })
      void triggerNoteSync()
    },
  })
}

export function useDeleteLocalNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteLocalNote(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LIST_KEY })
      void triggerNoteSync()
    },
  })
}
