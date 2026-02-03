import { useLocalSearchParams } from 'expo-router'
import PublicNoteEditorScreen from '@/features/notes/screens/PublicNoteEditorScreen'

export default function PublicEditNoteRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>()
  return <PublicNoteEditorScreen noteId={id ?? ''} />
}
