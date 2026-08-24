import Button from '@/components/Button'
import IllustrationHero from '@/components/IllustrationHero'
import { useTranslation } from '@/localization'
import { createThemedStyles } from '@/styles/createStyles'
import { layout } from '@/styles/layout'

import welcomeKitchenIllustration from '@assets/illustrations/welcome-kitchen.png'
import { useRouter } from 'expo-router'
import React, { useCallback } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function GetStartedScreen() {
  const router = useRouter()

  const goToRegister = useCallback(() => {
    router.push('/(public)/register')
  }, [router])

  const goToLogin = useCallback(() => {
    router.push('/(public)/login')
  }, [router])

  const continueAsGuest = useCallback(() => {
    router.replace('/(public)/(tabs)')
  }, [router])

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Header />

        <Actions
          onContinueAsGuest={continueAsGuest}
          onRegister={goToRegister}
          onLogin={goToLogin}
        />
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

function Actions({
  onContinueAsGuest,
  onRegister,
  onLogin,
}: {
  onContinueAsGuest: () => void
  onRegister: () => void
  onLogin: () => void
}) {
  const { t } = useTranslation()

  return (
    <View style={styles.actions}>
      <Button
        onPress={onLogin}
        variant="primary"
        size="lg"
        style={styles.primaryButton}
      >
        {t('auth.getStarted.login')}
      </Button>

      <Button
        onPress={onRegister}
        variant="secondary"
        size="lg"
        style={styles.secondaryButton}
      >
        {t('auth.getStarted.createAccount')}
      </Button>

      <Button
        onPress={onContinueAsGuest}
        variant="ghost"
        size="lg"
        style={styles.secondaryButton}
      >
        {t('auth.getStarted.continueAsGuest')}
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
    marginBottom: theme.spacing['2xl'],
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
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },

  subtitle: {
    textAlign: 'center',
    ...theme.textVariants.body,
    color: theme.colors.mutedForeground,
    maxWidth: 380,
  },

  actions: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    gap: layout.listGap,
  },

  primaryButton: {
    width: '100%',
  },

  secondaryButton: {
    width: '100%',
  },
}))
