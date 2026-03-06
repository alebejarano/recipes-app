import { router } from 'expo-router'

import EmailSettingsScreen from '@/features/profile/screens/EmailSettingsScreen'

export default function EmailSettingsRoute() {
  return <EmailSettingsScreen onBack={() => router.replace('/(auth)/(tabs)/profile')} />
}
