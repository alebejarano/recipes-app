import React from 'react'

import NoteEditorScreen from '@/features/notes/screens/NoteEditorScreen'

type EditNoteScreenProps = {
  noteId: string
}

export default function EditNoteScreen({ noteId }: EditNoteScreenProps) {
  return <NoteEditorScreen noteId={noteId} />
}
