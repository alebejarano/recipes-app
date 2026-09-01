// src/features/notes/hooks/useNote.ts
import { useQuery } from '@tanstack/react-query'

import { useAuth } from '@/features/auth/context/AuthContext'
import type { Note } from '../api/notesRepo'
import { getNoteById } from '../api/notesRepo'

type UseNoteParams = {
  enabled?: boolean
}

export function useNote(id: string, params?: UseNoteParams) {
  const { user } = useAuth()
  return useQuery<Note>({
    queryKey: ['notes', 'detail', user?.id ?? 'guest', id],
    queryFn: () => getNoteById(id),
    enabled: Boolean(id) && (params?.enabled ?? true),
  })
}
