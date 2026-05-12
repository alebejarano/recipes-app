import { router } from 'expo-router'

import ExportDataScreen from '@/features/profile/screens/ExportDataScreen'

export default function ExportDataRoute() {
  return <ExportDataScreen onBack={() => router.replace('/(public)/privacy')} />
}
