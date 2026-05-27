// src/features/notes/hooks/useCreateNote.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useAnalyticsCapture } from '@/features/analytics/events'
import type { CreateNoteInput, Note } from '../api/notesRepo'
import { createNote } from '../api/notesRepo'

export function useCreateNote() {
  const qc = useQueryClient()
  const captureAnalyticsEvent = useAnalyticsCapture()

  return useMutation({
    mutationFn: (input: CreateNoteInput) => createNote(input),
    onSuccess: (note: Note) => {
      captureAnalyticsEvent('note_created', {
        storage_mode: 'cloud',
      })
      qc.invalidateQueries({ queryKey: ['notes', 'list'] })
      qc.invalidateQueries({ queryKey: ['notes', 'detail', note.id] })
    },
  })
}
