// src/features/notes/hooks/useUpdateNote.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/features/auth/context/AuthContext'

import type { Note, UpdateNoteInput } from '../api/notesRepo'
import { updateNote } from '../api/notesRepo'

export function useUpdateNote(id: string) {
  const { user } = useAuth()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateNoteInput) => updateNote(id, input),
    onSuccess: (note: Note) => {
      qc.setQueryData(['notes', 'detail', user?.id ?? 'guest', note.id], note)
      qc.invalidateQueries({ queryKey: ['notes', 'list'] })
    },
  })
}
