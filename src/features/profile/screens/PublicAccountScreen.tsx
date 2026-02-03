import { router } from 'expo-router'
import React, { useMemo, useState } from 'react'

import Screen from '@/components/Screen'
import { useTabBarBottomPadding } from '@/hooks/useTabBarBottomPadding'
import { createThemedStyles } from '@/styles/createStyles'
import { theme } from '@/styles/theme'

import DietaryPreferencesSection from '@/features/profile/components/DietaryPreferencesSection'
import ProfileHeader from '@/features/profile/components/ProfileHeader'
import ProfileUserCard from '@/features/profile/components/ProfileUserCard'
import SettingsSection from '@/features/profile/components/SettingsSection'

import {
  DEFAULT_DIETARY_PREFERENCES,
  DIETARY_OPTIONS,
  PREFERENCES_ITEMS,
  SUPPORT_ITEMS,
  type DietaryId,
  type PreferenceToggles,
} from '@/features/profile/data/profileMockData'

export default function PublicAccountScreen() {
  const bottomPadding = useTabBarBottomPadding(theme.spacing.xl)

  const [dietary, setDietary] = useState<DietaryId[]>(DEFAULT_DIETARY_PREFERENCES)
  const [toggles, setToggles] = useState<PreferenceToggles>({
    pushNotifications: true,
    emailUpdates: false,
  })

  const onToggleDietary = (id: DietaryId) => {
    setDietary((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const accountItems = useMemo(
    () => [
      {
        id: 'create-account',
        type: 'link' as const,
        title: 'Create an account',
        subtitle: 'Sync and back up your recipes',
        icon: 'user-plus' as const,
        tone: 'accent' as const,
        onPress: () => router.push('/(public)/get-started'),
      },
      {
        id: 'local-only',
        type: 'link' as const,
        title: 'Local-only mode',
        subtitle: 'Your data stays on this device',
        icon: 'hard-drive' as const,
        onPress: () => router.push('/(public)/get-started'),
      },
    ],
    []
  )

  return (
    <Screen scroll bottomPadding={bottomPadding} contentStyle={styles.content}>
      <ProfileHeader
        title="Account"
        subtitle="Local-only settings"
        onPressSettings={() => {
          // TODO later
        }}
      />

      <ProfileUserCard
        name="Guest"
        email="Not signed in"
        onPressEdit={() => {
          router.push('/(public)/get-started')
        }}
      />

      <DietaryPreferencesSection
        title="Dietary Preferences"
        optional
        options={DIETARY_OPTIONS}
        value={dietary}
        onToggle={onToggleDietary}
      />

      <SettingsSection
        title="Preferences"
        items={PREFERENCES_ITEMS({
          toggles,
          setToggles,
        })}
      />

      <SettingsSection title="Account" items={accountItems} />

      <SettingsSection title="Support" items={SUPPORT_ITEMS} />
    </Screen>
  )
}

const styles = createThemedStyles((theme) => ({
  content: {
    gap: theme.spacing.xl,
  },
}))
