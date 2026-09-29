import { Redirect } from 'expo-router'

import LibraryArchivePreviewScreen from '@/features/recipes/screens/LibraryArchivePreviewScreen'

export default function LibraryPreviewRoute() {
  if (!__DEV__) return <Redirect href="/(auth)/(tabs)/profile" />
  return <LibraryArchivePreviewScreen />
}
