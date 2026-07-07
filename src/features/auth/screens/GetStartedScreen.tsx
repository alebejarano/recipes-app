import Button from '@/components/Button'
import IllustrationHero from '@/components/IllustrationHero'
import { useTranslation } from '@/localization'
import { createThemedStyles } from '@/styles/createStyles'
import { layout } from '@/styles/layout'

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

export default function GetStartedScreen() {
  const router = useRouter()
  const { t } = useTranslation()

  const benefits: Benefit[] = [
    { id: 'identity', text: t('auth.getStarted.benefits.identity') },
    { id: 'upgrade', text: t('auth.getStarted.benefits.upgrade') },
    { id: 'migration', text: t('auth.getStarted.benefits.migration') },
  ]

  const goToRegister = useCallback(() => {
    router.push('/(public)/register')
  }, [router])

  const goToLogin = useCallback(() => {
    router.push('/(public)/login')
  }, [router])

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Header />

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('auth.getStarted.cardTitle')}</Text>

          <BenefitList benefits={benefits} />

          <Actions onRegister={goToRegister} onLogin={goToLogin} />

          <Text style={styles.microCopy}>{t('auth.getStarted.microCopy')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function Header() {
  const { t } = useTranslation()

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

     <Text style={styles.title}>{t('auth.getStarted.title')}</Text>

      <Text style={styles.subtitle}>
        {t('auth.getStarted.subtitle')}
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
  const { t } = useTranslation()

  return (
    <View style={styles.actions}>
      <Button
        onPress={onRegister}
        variant="primary"
        size="lg"
        style={styles.primaryButton}
      >
        {t('auth.getStarted.createAccount')}
      </Button>

      <Button
        onPress={onLogin}
        variant="secondary"
        size="lg"
        style={styles.secondaryButton}
      >
        {t('auth.getStarted.login')}
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
    paddingHorizontal: layout.screenPadding,
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
    ...theme.textVariants.display,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },

  subtitle: {
    textAlign: 'center',
    ...theme.textVariants.body,
    color: theme.colors.mutedForeground,
    maxWidth: 380,
  },

  card: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    padding: theme.spacing.xl,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.soft,
  },

  cardTitle: {
    ...theme.textVariants.heading,
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
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },

  benefitIcon: {
    color: theme.colors.primaryDark,
  },

  benefitText: {
    flex: 1,
    ...theme.textVariants.body,
    color: theme.colors.mutedForeground,
  },

  actions: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
    gap: layout.listGap,
  },

  primaryButton: {
    width: '100%',
  },

  secondaryButton: {
    width: '100%',
  },

  microCopy: {
    textAlign: 'center',
    ...theme.textVariants.caption,
    color: theme.colors.mutedForeground,
    marginTop: theme.spacing.xs,
  },
}))
