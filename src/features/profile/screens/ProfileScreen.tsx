import React, { useCallback, useMemo, useState } from 'react'
import { Alert } from 'react-native'

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
  buildAccountItems,
  type DietaryId,
  type PreferenceToggles,
} from '@/features/profile/data/profileMockData'

import { useAuth } from '@/features/auth/context/AuthContext'

export default function ProfileScreen() {
  const bottomPadding = useTabBarBottomPadding(theme.spacing.xl)

  const { user, logout } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const displayName = useMemo(() => {
    // You can later pull this from profile table; for now use email prefix
    const email = user?.email ?? ''
    if (!email) return 'Account'
    return email.split('@')[0] || 'Account'
  }, [user?.email])

  const [dietary, setDietary] = useState<DietaryId[]>(DEFAULT_DIETARY_PREFERENCES)

  const [toggles, setToggles] = useState<PreferenceToggles>({
    pushNotifications: true,
    emailUpdates: false,
  })

  const onToggleDietary = (id: DietaryId) => {
    setDietary((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const onLogoutPress = useCallback(async () => {
  if (isLoggingOut) return

  setIsLoggingOut(true)
  try {
    await logout()
    // No manual navigation needed:
    // (auth)/_layout.tsx will redirect when session/user becomes null.
  } catch (e: any) {
    Alert.alert('Unable to log out', e?.message ?? 'Please try again.')
  } finally {
    setIsLoggingOut(false)
  }
  }, [isLoggingOut, logout])


  const accountItems = useMemo(
    () =>
      buildAccountItems({
        isLoggingOut,
        onLogoutPress,
      }),
    [isLoggingOut, onLogoutPress]
  )

  return (
    <Screen scroll bottomPadding={bottomPadding} contentStyle={styles.content}>
      <ProfileHeader
        title="Profile"
        subtitle="Manage your account"
        onPressSettings={() => {
          // TODO later
        }}
      />

      <ProfileUserCard
        name={displayName}
        email={user?.email ?? ''}
        onPressEdit={() => {
          // TODO later
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
