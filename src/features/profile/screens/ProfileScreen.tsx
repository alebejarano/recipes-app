import { router } from 'expo-router'
import React, { useCallback, useContext, useMemo, useState } from 'react'
import { Alert } from 'react-native'

import Screen from '@/components/Screen'
import { useTabBarBottomPadding } from '@/hooks/useTabBarBottomPadding'
import { createThemedStyles } from '@/styles/createStyles'
import { theme } from '@/styles/theme'

import ProfileHeader from '@/features/profile/components/ProfileHeader'
import ProfileUserCard from '@/features/profile/components/ProfileUserCard'
import SettingsSection from '@/features/profile/components/SettingsSection'

import {
  PREFERENCES_ITEMS,
  SUPPORT_ITEMS,
  buildAccountItems,
  type AccountPlan,
  type PreferenceToggles,
} from '@/features/profile/data/profileMockData'

import { useAuth } from '@/features/auth/context/AuthContext'
import { SubscriptionContext } from '@/features/subscription/context/SubscriptionContext'

export default function ProfileScreen() {
  const bottomPadding = useTabBarBottomPadding(theme.spacing.xl)

  const { user, logout } = useAuth()
  const { plan } = useContext(SubscriptionContext)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const accountPlan: AccountPlan = plan === 'premium' ? 'premium' : 'free'

  const displayName = useMemo(() => {
    // You can later pull this from profile table; for now use email prefix
    const email = user?.email ?? ''
    if (!email) return 'Account'
    return email.split('@')[0] || 'Account'
  }, [user?.email])

  const [toggles, setToggles] = useState<PreferenceToggles>({
    pushNotifications: true,
    emailUpdates: false,
  })

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

  const onDeleteAccountPress = useCallback(() => {
    Alert.alert(
      'Delete account',
      'This will permanently remove your data. Delete account flow is not connected yet.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
        },
      ]
    )
  }, [])

  const accountItems = useMemo(
    () =>
      buildAccountItems({
        plan: accountPlan,
        onPremiumPress: () => router.push('/premium'),
        onManagePlanPress: () => router.push('/premium'),
        onPrivacyPress: () => router.push('/privacy'),
        isLoggingOut,
        onLogoutPress,
        onDeleteAccountPress,
      }),
    [accountPlan, isLoggingOut, onDeleteAccountPress, onLogoutPress]
  )

  return (
    <Screen scroll bottomPadding={bottomPadding} contentStyle={styles.content}>
      <ProfileHeader
        title="Account"
        subtitle={accountPlan === 'premium' ? 'Premium plan' : 'Free plan, local-first'}
        onPressSettings={() => {
          // TODO later
        }}
      />

      <ProfileUserCard
        name={displayName}
        email={user?.email ?? ''}
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
