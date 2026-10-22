import { useAuth } from '@/features/auth/context/AuthContext'
import { Redirect, Slot, useSegments } from 'expo-router'

export default function PublicLayout() {
  const { user, isLoading } = useAuth()
  const segments = useSegments()
  const currentLeaf = segments[1]
  const isAllowedWhileAuthenticated =
    currentLeaf === 'privacy-policy' ||
    currentLeaf === 'terms' ||
    currentLeaf === 'legal-notice' ||
    currentLeaf === 'update-password'

  if (isLoading) return null

  if (user && !isAllowedWhileAuthenticated) {
    return <Redirect href="/(auth)/(tabs)" />
  }

  return <Slot />
}
