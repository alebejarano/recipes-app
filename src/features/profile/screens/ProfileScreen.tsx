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
} from '@/features/profile/data/profileSettingsData'

import { useAuth } from '@/features/auth/context/AuthContext'
import { SubscriptionContext } from '@/features/subscription/context/SubscriptionContext'

export default function ProfileScreen() {
  const bottomPadding = useTabBarBottomPadding(theme.spacing.xl)

  const { user, logout, deleteAccount } = useAuth()
  const { plan } = useContext(SubscriptionContext)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const accountPlan: AccountPlan = plan === 'premium' ? 'premium' : 'free'

  const displayName = useMemo(() => {
    const metadataName = user?.user_metadata?.display_name
    if (typeof metadataName === 'string' && metadataName.trim()) {
      return metadataName.trim()
    }
    const email = user?.email ?? ''
    if (!email) return 'Account'
    return email.split('@')[0] || 'Account'
  }, [user?.email, user?.user_metadata?.display_name])

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

  const performDeleteAccount = useCallback(async () => {
    if (isDeletingAccount) return

    setIsDeletingAccount(true)
    try {
      await deleteAccount()
    } catch (e: any) {
      Alert.alert('Unable to delete account', e?.message ?? 'Please try again.')
    } finally {
      setIsDeletingAccount(false)
    }
  }, [deleteAccount, isDeletingAccount])

  const onDeleteAccountPress = useCallback(() => {
    Alert.alert(
      'Delete account',
      'This permanently deletes your account and cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void performDeleteAccount()
          },
        },
      ]
    )
  }, [performDeleteAccount])

  const accountItems = useMemo(
    () =>
      buildAccountItems({
        plan: accountPlan,
        onPremiumPress: () => router.push('/premium'),
        onCurrentPlanPress: () => router.push('/current-plan'),
        onManagePlanPress: () => router.push('/current-plan'),
        onPrivacyPress: () => router.push('/privacy'),
        isLoggingOut,
        isDeletingAccount,
        onLogoutPress,
        onDeleteAccountPress,
      }),
    [accountPlan, isDeletingAccount, isLoggingOut, onDeleteAccountPress, onLogoutPress]
  )

  return (
    <Screen scroll bottomPadding={bottomPadding} contentStyle={styles.content}>
      <ProfileHeader
        title="Account"
      />

      <ProfileUserCard
        name={displayName}
        email={user?.new_email ?? user?.email ?? ''}
        onPressEdit={() => router.push('/(auth)/account/edit-profile')}
      />

      <SettingsSection
        title="Preferences"
        items={PREFERENCES_ITEMS({
          toggles,
          setToggles,
        })}
      />

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
