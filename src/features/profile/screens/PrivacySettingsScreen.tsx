import { router } from 'expo-router'
import React, { useCallback, useMemo, useState } from 'react'
import { Alert, Text } from 'react-native'

import { useAuth } from '@/features/auth/context/AuthContext'
import ProfileSubpageLayout from '@/features/profile/components/ProfileSubpageLayout'
import SettingsSection from '@/features/profile/components/SettingsSection'
import { exportUserData } from '@/features/profile/services/exportUserData'
import { useStorageStrategy } from '@/features/storage/context/StorageStrategyContext'
import { createThemedStyles } from '@/styles/createStyles'

type PrivacySettingsScreenProps = {
  onBack: () => void
}

export default function PrivacySettingsScreen({ onBack }: PrivacySettingsScreenProps) {
  const { user, deleteAccount } = useAuth()
  const { strategy } = useStorageStrategy()
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [isExportingData, setIsExportingData] = useState(false)
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

  const onExportDataPress = useCallback(async () => {
    if (isExportingData) return

    setIsExportingData(true)
    try {
      await exportUserData({
        userId: user?.id ?? null,
        email: user?.email ?? null,
        displayName: typeof user?.user_metadata?.display_name === 'string'
          ? user.user_metadata.display_name
          : null,
        storageStrategy: strategy,
      })
      Alert.alert('Export ready', 'Your data export has been prepared and opened in the share sheet.')
    } catch (error: any) {
      Alert.alert('Unable to export data', error?.message ?? 'Please try again.')
    } finally {
      setIsExportingData(false)
    }
  }, [isExportingData, strategy, user?.email, user?.id, user?.user_metadata?.display_name])

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
        id: 'export',
        type: 'link' as const,
        icon: 'download' as const,
        title: isExportingData ? 'Preparing export…' : 'Export recipes & data',
        subtitle: hasAccount
          ? 'Download a copy of your recipes and account data.'
          : 'Download a copy of your recipes and data stored on this device.',
        onPress: onExportDataPress,
        disabled: isExportingData,
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
    [hasAccount, isExportingData, onExportDataPress]
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
