import { router } from 'expo-router'

import PasswordSettingsScreen from '@/features/profile/screens/PasswordSettingsScreen'

export default function PasswordSettingsRoute() {
  return <PasswordSettingsScreen onBack={() => router.replace('/(auth)/privacy')} />
}
