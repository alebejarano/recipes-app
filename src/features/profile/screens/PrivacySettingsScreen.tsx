import { router } from 'expo-router'
import React, { useCallback, useMemo, useState } from 'react'
import { Alert, Text } from 'react-native'

import { useAuth } from '@/features/auth/context/AuthContext'
import ProfileSubpageLayout from '@/features/profile/components/ProfileSubpageLayout'
import SettingsSection from '@/features/profile/components/SettingsSection'
import { createThemedStyles } from '@/styles/createStyles'

type PrivacySettingsScreenProps = {
  onBack: () => void
}

export default function PrivacySettingsScreen({ onBack }: PrivacySettingsScreenProps) {
  const { user, deleteAccount } = useAuth()
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const hasAccount = Boolean(user?.id)

  const performDeleteAccount = useCallback(async () => {
    if (!hasAccount || isDeletingAccount) return

    setIsDeletingAccount(true)
    try {
      await deleteAccount()
    } catch (error: any) {
      Alert.alert('Unable to delete account', error?.message ?? 'Please try again.')
    } finally {
      setIsDeletingAccount(false)
    }
  }, [deleteAccount, hasAccount, isDeletingAccount])

  const onDeleteAccountPress = useCallback(() => {
    if (!hasAccount || isDeletingAccount) return

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
  }, [hasAccount, isDeletingAccount, performDeleteAccount])

  const unavailableSubtitle = 'Create an account to manage this setting'
  const settingsItems = useMemo(
    () => [
      {
        id: 'password',
        type: 'link' as const,
        icon: 'lock' as const,
        title: 'Password',
        subtitle: hasAccount ? 'Update your password to keep your account secure.' : unavailableSubtitle,
        onPress: hasAccount
          ? () => router.push('/(auth)/settings/password')
          : undefined,
        disabled: !hasAccount,
      },
      {
        id: 'sessions',
        type: 'link' as const,
        icon: 'monitor' as const,
        title: 'Active sessions',
        subtitle: hasAccount ? 'See where your account is signed in.' : unavailableSubtitle,
        onPress: hasAccount
          ? () => Alert.alert('Active sessions', 'Session management is coming soon.')
          : undefined,
        disabled: !hasAccount,
      },
      {
        id: 'export',
        type: 'link' as const,
        icon: 'download' as const,
        title: 'Export recipes & data',
        subtitle: hasAccount
          ? 'Download a copy of your recipes and account data.'
          : unavailableSubtitle,
        onPress: hasAccount
          ? () => Alert.alert('Export data', 'Data export is coming soon.')
          : undefined,
        disabled: !hasAccount,
      },
      {
        id: 'policy',
        type: 'link' as const,
        icon: 'file-text' as const,
        title: 'Privacy policy',
        subtitle: 'Learn how we handle and protect your data.',
        onPress: () => router.push('/privacy-policy'),
      },
      {
        id: 'terms',
        type: 'link' as const,
        icon: 'file-text' as const,
        title: 'Terms of service',
        subtitle: 'Read the rules and conditions for using the app.',
        onPress: () => router.push('/(public)/terms'),
      },
    ],
    [hasAccount]
  )
  const dangerItems = useMemo(
    () => [
      {
        id: 'delete-account',
        type: 'link' as const,
        icon: 'trash-2' as const,
        title: isDeletingAccount ? 'Deleting account…' : 'Delete account',
        subtitle: hasAccount
          ? 'Permanently remove your account and all saved recipes.'
          : unavailableSubtitle,
        tone: 'danger' as const,
        onPress: hasAccount && !isDeletingAccount ? onDeleteAccountPress : undefined,
        disabled: !hasAccount || isDeletingAccount,
      },
    ],
    [hasAccount, isDeletingAccount, onDeleteAccountPress]
  )

  return (
    <ProfileSubpageLayout title="Privacy & Security" onBack={onBack}>
      <Text style={styles.intro}>
        Your recipes and account are private. Manage your security settings and control your data
        here.
      </Text>

      <SettingsSection
        title="Settings"
        items={settingsItems}
      />

      <SettingsSection
        title="Danger Zone"
        items={dangerItems}
      />
    </ProfileSubpageLayout>
  )
}

const styles = createThemedStyles((theme) => ({
  intro: {
    marginTop: -theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
  },
}))
