import { useLocalSearchParams } from 'expo-router'
import React from 'react'

import EditNoteScreen from '@/features/notes/screens/EditNoteScreen'

export default function NoteEditRoute() {
  const { id } = useLocalSearchParams<{ id: string }>()

  return <EditNoteScreen noteId={id ?? ''} />
}
