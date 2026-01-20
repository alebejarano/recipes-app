import { useAuth } from '@/features/auth/context/AuthContext'
import { Redirect, Slot } from 'expo-router'

export default function PublicLayout() {
  const { session, isLoading } = useAuth()

  if (isLoading) return null

  if (session) {
    return <Redirect href="/(auth)/(tabs)" />
  }

  return <Slot />
}
