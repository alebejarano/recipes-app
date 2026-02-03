import { useAuth } from '@/features/auth/context/AuthContext'
import { Redirect, Slot, useLocalSearchParams } from 'expo-router'

export default function PublicLayout() {
  const { session, isLoading } = useAuth()
  const { dev } = useLocalSearchParams<{ dev?: string }>()
  const allowDevPreview = __DEV__ && dev === '1'

  if (isLoading) return null

  if (session && !allowDevPreview) {
    return <Redirect href="/(auth)/(tabs)" />
  }

  return <Slot />
}
