import { useLocalSearchParams } from 'expo-router'
import PublicNoteDetailScreen from '@/features/notes/screens/PublicNoteDetailScreen'

export default function PublicNoteDetailRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>()
  return <PublicNoteDetailScreen noteId={id ?? ''} />
}
