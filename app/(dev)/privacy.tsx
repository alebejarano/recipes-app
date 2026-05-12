import { router } from 'expo-router'

import PrivacySettingsScreen from '@/features/profile/screens/PrivacySettingsScreen'

export default function PrivacySettingsRoute() {
  return (
    <PrivacySettingsScreen
      onBack={() => router.replace('/(dev)/(tabs)/profile')}
      exportRoute="/(dev)/settings/export-data"
    />
  )
}
