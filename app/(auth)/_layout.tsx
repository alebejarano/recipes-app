import { useAuth } from '@/features/auth/context/AuthContext'
import { Redirect, Slot } from 'expo-router'

export default function AuthLayout() {
  const { user, isLoading } = useAuth()

  if (isLoading) return null

  if (!user) {
    return <Redirect href="/(public)/get-started" />
  }

  return <Slot />
}
