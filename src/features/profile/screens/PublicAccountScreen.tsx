import { router } from 'expo-router'
import React, { useMemo } from 'react'

import Screen from '@/components/Screen'
import { useTabBarBottomPadding } from '@/hooks/useTabBarBottomPadding'
import { useTranslation } from '@/localization'
import { createThemedStyles } from '@/styles/createStyles'
import { theme } from '@/styles/theme'

import ProfileHeader from '@/features/profile/components/ProfileHeader'
import ProfileUserCard from '@/features/profile/components/ProfileUserCard'
import SettingsSection from '@/features/profile/components/SettingsSection'

import { buildSupportItems } from '@/features/profile/data/profileSettingsData'

export default function PublicAccountScreen() {
  const bottomPadding = useTabBarBottomPadding(theme.spacing.xl)
  const { languagePreference, locale, t } = useTranslation()

  const accountItems = useMemo(
    () => [
      {
        id: 'create-account',
        type: 'link' as const,
        title: t('profile.guest.items.createAccountTitle'),
        subtitle: t('profile.guest.items.createAccountSubtitle'),
        icon: 'user-plus' as const,
        tone: 'accent' as const,
        onPress: () => router.push('/(public)/register'),
      },
      {
        id: 'guest-plan',
        type: 'link' as const,
        title: t('profile.guest.items.currentPlanTitle'),
        subtitle: t('profile.guest.items.currentPlanSubtitle'),
        icon: 'hard-drive' as const,
        onPress: () => router.push('/current-plan'),
      },
      {
        id: 'privacy',
        type: 'link' as const,
        title: t('profile.guest.items.privacyTitle'),
        subtitle: t('profile.guest.items.privacySubtitle'),
        icon: 'shield' as const,
        onPress: () => router.push('/privacy'),
      },
    ],
    [t]
  )

  const notificationsItems = useMemo(
    () => [
      {
        id: 'push-disabled',
        type: 'link' as const,
        title: t('profile.guest.items.pushTitle'),
        subtitle: t('profile.guest.items.gatedSubtitle'),
        icon: 'bell' as const,
        disabled: true,
      },
      {
        id: 'email-disabled',
        type: 'link' as const,
        title: t('profile.guest.items.emailTitle'),
        subtitle: t('profile.guest.items.gatedSubtitle'),
        icon: 'mail' as const,
        disabled: true,
      },
    ],
    [t]
  )

  const preferenceItems = useMemo(
    () => [
      {
        id: 'language',
        type: 'link' as const,
        title: t('profile.guest.items.languageTitle'),
        subtitle:
          languagePreference === 'system'
            ? t('profile.language.labels.system')
            : t(`profile.language.labels.${locale}`),
        icon: 'globe' as const,
        onPress: () => router.push('/(public)/settings/language' as any),
      },
    ],
    [languagePreference, locale, t]
  )

  return (
    <Screen scroll bottomPadding={bottomPadding} contentStyle={styles.content}>
      <ProfileHeader title={t('profile.guest.title')} />

      <ProfileUserCard name={t('profile.guest.name')} subtitle={t('profile.guest.email')} />

      <SettingsSection title={t('profile.guest.sections.preferences')} items={preferenceItems} />

      <SettingsSection title={t('profile.guest.sections.notifications')} items={notificationsItems} />

      <SettingsSection title={t('profile.guest.sections.account')} items={accountItems} />

      <SettingsSection
        title={t('profile.guest.sections.support')}
        items={buildSupportItems(t).map((item) =>
          item.id === 'help'
            ? {
                ...item,
                onPress: () => router.push('/faq'),
              }
            : item
        )}
      />
    </Screen>
  )
}

const styles = createThemedStyles((theme) => ({
  content: {
    gap: theme.spacing.xl,
  },
}))
