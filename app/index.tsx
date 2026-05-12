import { Link } from 'expo-router'
import { Text, View } from 'react-native'

import { createThemedStyles } from '@/styles/createStyles'

export default function DevLandingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dev Entry</Text>

      <View style={styles.links}>
        <Link href="/(public)/onboarding?dev=1" style={styles.link}>
          Onboarding
        </Link>

        <Link href="/(public)/onboarding?dev=1&reset=1" style={styles.link}>
          Onboarding reset
        </Link>

        <Link href="/(dev)/(tabs)/profile" style={styles.link}>
          Dev profile
        </Link>

        <Link href="/(auth)/(tabs)/profile" style={styles.link}>
          Normal profile
        </Link>
      </View>
    </View>
  )
}

const styles = createThemedStyles((theme) => ({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.background,
  },
  title: {
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.display,
    lineHeight: theme.lineHeight.display,
    color: theme.colors.foreground,
  },
  links: {
    gap: theme.spacing.md,
  },
  link: {
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    padding: theme.spacing.lg,
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.foreground,
    textAlign: 'center',
  },
}))
