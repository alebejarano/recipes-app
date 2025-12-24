// // app/index.tsx
// import { Redirect } from 'expo-router';
// import React from 'react';

// import { useAuth } from '@/features/auth/context/AuthContext';
// import { useOnboarding } from '@/features/onboarding/context/OnboardingContext';

// export default function Index() {
//   const { user, isLoading: authLoading } = useAuth();
//   const { isLoaded: onboardingLoaded, hasCompletedOnboarding } = useOnboarding();

//   if (__DEV__) {
//   return <Redirect href="/onboarding" />;
//   }


//   if (authLoading || !onboardingLoaded) {
//     return null;
//   }

//   if (!user || hasCompletedOnboarding) {
//     return <Redirect href="/(public)/get-started" />;;
//   }

//   if (user) {
//     return <Redirect href="/(auth)/(tabs)" />;
//   }

//   if (hasCompletedOnboarding) {
//     return <Redirect href="/login" />;
//   }

//   return <Redirect href="/onboarding" />;
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
