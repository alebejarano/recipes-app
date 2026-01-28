// src/features/notes/hooks/useNote.ts
import { useQuery } from '@tanstack/react-query'

import type { Note } from '../api/notesRepo'
import { getNoteById } from '../api/notesRepo'

export function useNote(id: string) {
  return useQuery<Note>({
    queryKey: ['notes', 'detail', id],
    queryFn: () => getNoteById(id),
    enabled: Boolean(id),
  })
}
