import { router } from 'expo-router'

import LanguageSettingsScreen from '@/features/profile/screens/LanguageSettingsScreen'

export default function LanguageSettingsRoute() {
  return <LanguageSettingsScreen onBack={() => router.replace('/(public)/(tabs)/profile')} />
}
