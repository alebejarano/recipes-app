import { Redirect } from 'expo-router'

export default function PublicHomeRoute() {
  return <Redirect href="/(public)/(tabs)" />
}
