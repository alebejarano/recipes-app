// app/index.tsx (final, after removing dev)
// import { Redirect } from 'expo-router'
// import { useAuth } from '@/features/auth/context/AuthContext'

// export default function Index() {
//   const { session, isLoading } = useAuth()
//   if (isLoading) return null

//   return session ? (
//     <Redirect href="/(auth)/(tabs)" />
//   ) : (
//     <Redirect href="/(public)/get-started" />
//   )
// }




// app/index.tsx
import { Link } from 'expo-router'
import { Text, View } from 'react-native'

import { createThemedStyles } from '@/styles/createStyles'

export default function DevLandingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Dev Entry
      </Text>

      <View style={styles.buttons}>
        <Link href="/(public)/onboarding?dev=1">
          Onboarding
        </Link>

        <Link href="/(public)/onboarding?dev=1&reset=1">
          Onboarding (reset)
        </Link>

        <Link href="/(dev)/(tabs)">
            Home (Tabs)
        </Link>

        <Link href="/(public)/get-started">
            Get started
        </Link>
      </View>
    </View>
  )
}

const styles = createThemedStyles((t) => ({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: t.spacing.xl,
    backgroundColor: t.colors.background,
  },

  title: {
    textAlign: 'center',
    marginBottom: t.spacing.xl,
  },

  buttons: {
    gap: t.spacing.md,
  },
}))
