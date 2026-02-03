import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { LocalNote } from '@/features/notes/storage/localNotesStorage'
import {
  createLocalNote,
  deleteLocalNote,
  getLocalNote,
  listLocalNotes,
  updateLocalNote,
} from '@/features/notes/storage/localNotesStorage'

const LIST_KEY = ['notes', 'local', 'list']

export function useLocalNotesList() {
  return useQuery<LocalNote[]>({
    queryKey: LIST_KEY,
    queryFn: listLocalNotes,
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
    mutationFn: (input: { title: string; content: string }) => createLocalNote(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LIST_KEY })
    },
  })
}

export function useUpdateLocalNote(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { title: string; content: string }) => updateLocalNote(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LIST_KEY })
      qc.invalidateQueries({ queryKey: ['notes', 'local', 'detail', id] })
    },
  })
}

export function useDeleteLocalNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteLocalNote(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LIST_KEY })
    },
  })
}
