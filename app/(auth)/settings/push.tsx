import { router } from 'expo-router'

import PushSettingsScreen from '@/features/profile/screens/PushSettingsScreen'

export default function PushSettingsRoute() {
  return <PushSettingsScreen onBack={() => router.replace('/(auth)/(tabs)/profile')} />
}
