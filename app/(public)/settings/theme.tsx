import { router } from 'expo-router'

import ThemeSettingsScreen from '@/features/profile/screens/ThemeSettingsScreen'

export default function ThemeSettingsRoute() {
  return <ThemeSettingsScreen onBack={() => router.replace('/(public)/(tabs)/profile')} />
}
