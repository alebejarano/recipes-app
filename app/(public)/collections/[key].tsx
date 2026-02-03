import { useLocalSearchParams } from 'expo-router'
import PublicCollectionDetailScreen from '@/features/collections/screens/PublicCollectionDetailScreen'

export default function PublicCollectionDetailRoute() {
  const { key, returnTo } = useLocalSearchParams<{ key?: string; returnTo?: string }>()
  return <PublicCollectionDetailScreen keyParam={key} returnToParam={returnTo} />
}
