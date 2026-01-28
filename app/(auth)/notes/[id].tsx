import { useLocalSearchParams } from 'expo-router'
import React from 'react'

import NoteDetailScreen from '@/features/notes/screens/NoteDetailScreen'

export default function NoteShowRoute() {
  const { id } = useLocalSearchParams<{ id: string }>()

  return <NoteDetailScreen noteId={id ?? ''} />
}
