import { useAuth } from '@/features/auth/context/AuthContext'
import { Redirect, Slot, useLocalSearchParams, useSegments } from 'expo-router'

export default function PublicLayout() {
  const { session, isLoading } = useAuth()
  const { dev } = useLocalSearchParams<{ dev?: string }>()
  const segments = useSegments()
  const allowDevPreview = __DEV__ && dev === '1'
  const currentLeaf = segments[1]
  const isLegalPage = currentLeaf === 'privacy-policy' || currentLeaf === 'terms'

  if (isLoading) return null

  if (session && !allowDevPreview && !isLegalPage) {
    return <Redirect href="/(auth)/(tabs)" />
  }

  return <Slot />
}
