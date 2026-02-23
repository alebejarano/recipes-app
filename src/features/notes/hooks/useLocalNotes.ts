import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { LocalNote } from '@/features/notes/storage/localNotesStorage'
import {
  createLocalNote,
  deleteLocalNote,
  getLocalNote,
  listLocalNotes,
  updateLocalNote,
} from '@/features/notes/storage/localNotesStorage'
import { triggerNoteSync } from '@/features/notes/sync/noteSync'

const LIST_KEY = ['notes', 'local', 'list']
type LocalNotesListParams = {
  limit?: number
  search?: string
}

export function useLocalNotesList(params?: LocalNotesListParams) {
  return useQuery<LocalNote[]>({
    queryKey: [...LIST_KEY, params?.limit ?? 200, params?.search ?? ''],
    queryFn: () => listLocalNotes(params),
  })
}

export function useLocalNote(id: string) {
  return useQuery<LocalNote | null>({
    queryKey: ['notes', 'local', 'detail', id],
    queryFn: () => getLocalNote(id),
    enabled: Boolean(id),
  })
}

export function useCreateLocalNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { title: string; content: string; pinnedAt?: string | null }) =>
      createLocalNote(input),
    onSuccess: () => {
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LIST_KEY })
      qc.invalidateQueries({ queryKey: ['notes', 'local', 'detail', id] })
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
