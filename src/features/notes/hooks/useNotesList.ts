// src/features/notes/hooks/useNotesList.ts
import { useQuery } from '@tanstack/react-query'

import { useAuth } from '@/features/auth/context/AuthContext'
import type { Note } from '../api/notesRepo'
import { listNotes } from '../api/notesRepo'

type NotesListParams = {
  limit?: number
  search?: string
  enabled?: boolean
}

export function useNotesList(params?: NotesListParams) {
  const { user } = useAuth()
  return useQuery<Note[]>({
    queryKey: ['notes', 'list', user?.id ?? 'guest', params?.limit ?? 50, params?.search ?? ''],
    queryFn: () => listNotes(params),
    enabled: params?.enabled ?? true,
  })
}
