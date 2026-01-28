// src/features/notes/hooks/useUpdateNote.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { Note, UpdateNoteInput } from '../api/notesRepo'
import { updateNote } from '../api/notesRepo'

export function useUpdateNote(id: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateNoteInput) => updateNote(id, input),
    onSuccess: (note: Note) => {
      qc.setQueryData(['notes', 'detail', note.id], note)
      qc.invalidateQueries({ queryKey: ['notes', 'list'] })
    },
  })
}
