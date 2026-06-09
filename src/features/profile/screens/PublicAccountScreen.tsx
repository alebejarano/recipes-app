import { router } from 'expo-router'
import React, { useMemo } from 'react'

import Screen from '@/components/Screen'
import { useTabBarBottomPadding } from '@/hooks/useTabBarBottomPadding'
import { createThemedStyles } from '@/styles/createStyles'
import { theme } from '@/styles/theme'

import ProfileHeader from '@/features/profile/components/ProfileHeader'
import ProfileUserCard from '@/features/profile/components/ProfileUserCard'
import SettingsSection from '@/features/profile/components/SettingsSection'

import { SUPPORT_ITEMS } from '@/features/profile/data/profileSettingsData'

export default function PublicAccountScreen() {
  const bottomPadding = useTabBarBottomPadding(theme.spacing.xl)

  const accountItems = useMemo(
    () => [
      {
        id: 'create-account',
        type: 'link' as const,
        title: 'Create an account',
        subtitle: 'Upgrade to sync and back up your recipes',
        icon: 'user-plus' as const,
        tone: 'accent' as const,
        onPress: () => router.push('/(public)/register'),
      },
      {
        id: 'guest-plan',
        type: 'link' as const,
        title: 'Current plan',
        subtitle: 'Guest mode, local only on this device',
        icon: 'hard-drive' as const,
        rightText: 'Guest',
        onPress: () => router.push('/current-plan'),
      },
      {
        id: 'privacy',
        type: 'link' as const,
        title: 'Privacy & Security',
        subtitle: 'Manage optional analytics',
        icon: 'shield' as const,
        onPress: () => router.push('/privacy'),
      },
    ],
    []
  )

  const notificationsItems = useMemo(
    () => [
      {
        id: 'push-disabled',
        type: 'link' as const,
        title: 'Push Notifications',
        subtitle: 'Create an account to customize',
        icon: 'bell' as const,
        disabled: true,
      },
      {
        id: 'email-disabled',
        type: 'link' as const,
        title: 'Email Updates',
        subtitle: 'Create an account to customize',
        icon: 'mail' as const,
        disabled: true,
      },
    ],
    []
  )

  return (
    <Screen scroll bottomPadding={bottomPadding} contentStyle={styles.content}>
      <ProfileHeader title="Account" />

      <ProfileUserCard name="Guest" email="Not signed in" />

      <SettingsSection title="Notifications" items={notificationsItems} />

      <SettingsSection title="Account" items={accountItems} />

      <SettingsSection
        title="Support"
        items={SUPPORT_ITEMS.map((item) =>
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
