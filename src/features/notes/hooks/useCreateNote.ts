// src/features/notes/hooks/useCreateNote.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { CreateNoteInput, Note } from '../api/notesRepo'
import { createNote } from '../api/notesRepo'

export function useCreateNote() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateNoteInput) => createNote(input),
    onSuccess: (note: Note) => {
      qc.invalidateQueries({ queryKey: ['notes', 'list'] })
      qc.invalidateQueries({ queryKey: ['notes', 'detail', note.id] })
    },
  })
}
