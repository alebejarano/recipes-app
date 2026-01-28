// src/features/notes/hooks/useNotesList.ts
import { useQuery } from '@tanstack/react-query'

import type { Note } from '../api/notesRepo'
import { listNotes } from '../api/notesRepo'

export function useNotesList(params?: { limit?: number; search?: string }) {
  return useQuery<Note[]>({
    queryKey: ['notes', 'list', params?.limit ?? 50, params?.search ?? ''],
    queryFn: () => listNotes(params),
  })
}
