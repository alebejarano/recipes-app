// src/features/notes/hooks/useNotesList.ts
import { useQuery } from '@tanstack/react-query'

import type { Note } from '../api/notesRepo'
import { listNotes } from '../api/notesRepo'

type NotesListParams = {
  limit?: number
  search?: string
  enabled?: boolean
}

export function useNotesList(params?: NotesListParams) {
  return useQuery<Note[]>({
    queryKey: ['notes', 'list', params?.limit ?? 50, params?.search ?? ''],
    queryFn: () => listNotes(params),
    enabled: params?.enabled ?? true,
  })
}
