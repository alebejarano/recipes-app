import { Redirect } from 'expo-router'

import { useAuth } from '@/features/auth/context/AuthContext'

export default function Index() {
  const { session, isLoading } = useAuth()
  if (isLoading) return null

  return session ? (
    <Redirect href="/(auth)/(tabs)" />
  ) : (
    <Redirect href="/(public)/get-started" />
  )
}
