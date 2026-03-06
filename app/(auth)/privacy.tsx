import { router } from 'expo-router'

import PrivacySettingsScreen from '@/features/profile/screens/PrivacySettingsScreen'

export default function PrivacySettingsRoute() {
  return <PrivacySettingsScreen onBack={() => router.replace('/(auth)/(tabs)/profile')} />
}
