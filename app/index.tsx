// import React from 'react'
// import { Redirect } from 'expo-router'
// import { useAuth } from '@/features/auth/context/AuthContext'
// import { useOnboarding } from '@/features/onboarding/context/OnboardingContext'

// export default function Index() {
//   const { user, isLoading: authLoading } = useAuth()
//   const { isLoaded: onboardingLoaded, hasCompletedOnboarding } = useOnboarding()

//   if (authLoading || !onboardingLoaded) return null

//   // Logged out
//   if (!user) {
//     return hasCompletedOnboarding
//       ? <Redirect href="/(public)/login" />
//       : <Redirect href="/(public)/get-started" />
//   }

//   // Logged in
//   return hasCompletedOnboarding
//     ? <Redirect href="/(auth)/(tabs)" />
//     : <Redirect href="/onboarding" />
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
        <Link href="/onboarding">
          Onboarding
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
