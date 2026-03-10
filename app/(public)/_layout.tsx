import { useAuth } from '@/features/auth/context/AuthContext'
import { Redirect, Slot, useLocalSearchParams, useSegments } from 'expo-router'

export default function PublicLayout() {
  const { session, isLoading } = useAuth()
  const { dev } = useLocalSearchParams<{ dev?: string }>()
  const segments = useSegments()
  const allowDevPreview = __DEV__ && dev === '1'
  const currentLeaf = segments[1]
  const isAllowedWhileAuthenticated =
    currentLeaf === 'privacy-policy' || currentLeaf === 'terms' || currentLeaf === 'update-password'

  if (isLoading) return null

  if (session && !allowDevPreview && !isAllowedWhileAuthenticated) {
    return <Redirect href="/(auth)/(tabs)" />
  }

  return <Slot />
}
