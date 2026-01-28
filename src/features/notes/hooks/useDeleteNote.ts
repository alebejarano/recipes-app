// src/features/notes/hooks/useDeleteNote.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { deleteNoteById } from '../api/notesRepo'

export function useDeleteNote() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteNoteById(id),
    onSuccess: (_data, id) => {
      qc.removeQueries({ queryKey: ['notes', 'detail', id] })
      qc.invalidateQueries({ queryKey: ['notes', 'list'] })
    },
  })
}
