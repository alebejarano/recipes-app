import Button from '@/components/Button'
import IllustrationHero from '@/components/IllustrationHero'
import { createThemedStyles } from '@/styles/createStyles'

import welcomeKitchenIllustration from '@assets/illustrations/welcome-kitchen.png'
import { Feather } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React, { memo, useCallback } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

type Benefit = {
  id: string
  text: string
}

const BENEFITS: Benefit[] = [
  { id: 'collections', text: 'Save recipes and organize them into collections' },
  { id: 'notes', text: 'Add notes, substitutions, and personal tweaks' },
  { id: 'sync', text: 'Access everything across devices' },
]

export default function GetStartedScreen() {
  const router = useRouter()

  const goToRegister = useCallback(() => {
    router.push('/(public)/register')
  }, [router])

  const goToLogin = useCallback(() => {
    router.push('/(public)/login')
  }, [router])

  // Optional: turn onboarding into an explicit “tour” (not a gate).
  // const goToTour = useCallback(() => {
  //   router.push('/onboarding') // resolves to (public)/onboarding/index.tsx
  // }, [router])

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Header />

        <View style={styles.card}>
          <Text style={styles.cardTitle}>With an account you can:</Text>

          <BenefitList benefits={BENEFITS} />

          <Actions onRegister={goToRegister} onLogin={goToLogin} />

          <Text style={styles.microCopy}>
            No setup required. Create an account and start adding recipes right away.
          </Text>

          {/* Optional “tour” link. Keep it subtle to avoid “welcome screen fatigue”. */}
          {/*
          <Button
            onPress={goToTour}
            variant="ghost"
            size="lg"
            style={styles.ghostButton}
            textStyle={styles.ghostButtonText}
          >
            See how it works (1 min)
          </Button>
          */}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function Header() {
  return (
    <View style={styles.header}>
      <View style={styles.illustrationWrap}>
        <IllustrationHero
          source={welcomeKitchenIllustration}
          maxWidth={360}
          maxHeight={320}
          aspectRatio={4 / 3}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.title}>Save your recipes and notes</Text>

      <Text style={styles.subtitle}>
        Create an account to keep your recipes, personal notes, and favorites in one place—available
        whenever you come back.
      </Text>
    </View>
  )
}

const BenefitList = memo(function BenefitList({ benefits }: { benefits: Benefit[] }) {
  return (
    <View style={styles.benefits}>
      {benefits.map((b) => (
        <BenefitRow key={b.id} text={b.text} />
      ))}
    </View>
  )
})

const BenefitRow = memo(function BenefitRow({ text }: { text: string }) {
  return (
    <View style={styles.benefitRow}>
      <View style={styles.benefitIconWrap}>
        <Feather name="check" size={16} style={styles.benefitIcon} />
      </View>

      <Text style={styles.benefitText}>{text}</Text>
    </View>
  )
})

function Actions({
  onRegister,
  onLogin,
}: {
  onRegister: () => void
  onLogin: () => void
}) {
  return (
    <View style={styles.actions}>
      <Button
        onPress={onRegister}
        size="lg"
        style={styles.primaryButton}
        textStyle={styles.primaryButtonText}
      >
        Create an account
      </Button>

      <Button
        onPress={onLogin}
        variant="secondary"
        size="lg"
        style={styles.secondaryButton}
        textStyle={styles.secondaryButtonText}
      >
        I already have an account
      </Button>
    </View>
  )
}

const styles = createThemedStyles((theme) => ({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },

  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },

  illustrationWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },

  title: {
    textAlign: 'center',
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.display,
    lineHeight: theme.lineHeight.display,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },

  subtitle: {
    textAlign: 'center',
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
    maxWidth: 380,
  },

  card: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    padding: theme.spacing.xl,
    borderRadius: theme.radii.xl, // per your design system memory
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.soft,
  },

  cardTitle: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.xl,
    lineHeight: theme.lineHeight.xl,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.md,
  },

  benefits: {
    marginBottom: theme.spacing.lg,
  },

  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },

  benefitIconWrap: {
    width: 28,
    height: 28,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.sageLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },

  benefitIcon: {
    color: theme.colors.sage,
  },

  benefitText: {
    flex: 1,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
  },

  actions: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },

  primaryButton: {
    width: '100%',
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
  },

  primaryButtonText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.base,
    color: theme.colors.primaryForeground,
  },

  secondaryButton: {
    width: '100%',
    borderRadius: 999,
    backgroundColor: theme.colors.secondary,
  },

  secondaryButtonText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.base,
    color: theme.colors.secondaryForeground,
  },

  microCopy: {
    textAlign: 'center',
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.xs,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.mutedForeground,
    marginTop: theme.spacing.xs,
  },

  // ghostButton: { width: '100%', borderRadius: 999, marginTop: theme.spacing.sm },
  // ghostButtonText: { fontFamily: theme.fontFamily.medium, fontSize: theme.fontSize.base, color: theme.colors.sage },
}))
