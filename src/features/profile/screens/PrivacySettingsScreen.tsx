import { router } from 'expo-router'
import React, { useCallback, useMemo, useState } from 'react'
import { Alert, Text, View } from 'react-native'

import { useAnalyticsConsent } from '@/features/analytics/context/AnalyticsConsentContext'
import { useAuth } from '@/features/auth/context/AuthContext'
import ProfileSubpageLayout from '@/features/profile/components/ProfileSubpageLayout'
import SettingsSection from '@/features/profile/components/SettingsSection'
import { getUserFacingErrorMessage } from '@/lib/userFacingError'
import { createThemedStyles } from '@/styles/createStyles'

type PrivacySettingsScreenProps = {
  onBack: () => void
  exportRoute: string
}

export default function PrivacySettingsScreen({ onBack, exportRoute }: PrivacySettingsScreenProps) {
  const { user, deleteAccount } = useAuth()
  const { analyticsEnabled, isLoaded: analyticsConsentLoaded, setAnalyticsEnabled } = useAnalyticsConsent()
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const hasAccount = Boolean(user?.id)

  const performDeleteAccount = useCallback(async () => {
    if (!hasAccount || isDeletingAccount) return

    setIsDeletingAccount(true)
    try {
      await deleteAccount()
    } catch (error: any) {
      Alert.alert('Unable to delete account', getUserFacingErrorMessage(error))
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
        id: 'analytics-diagnostics',
        type: 'toggle' as const,
        icon: 'activity' as const,
        title: 'Analytics & diagnostics',
        subtitle: 'Optional. Shares only minimal, sanitized app events to improve reliability and features.',
        value: analyticsEnabled,
        onValueChange: setAnalyticsEnabled,
        disabled: !analyticsConsentLoaded,
      },
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
        title: 'Export recipes & data',
        subtitle: hasAccount
          ? 'Download a copy of your recipes and account data.'
          : 'Download a copy of your recipes and data stored on this device.',
        onPress: () => router.push(exportRoute as any),
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
      {
        id: 'legal-notice',
        type: 'link' as const,
        icon: 'info' as const,
        title: 'Legal notice',
        subtitle: 'Business identification and legal information.',
        onPress: () => router.push('/(public)/legal-notice' as any),
      },
    ],
    [analyticsConsentLoaded, analyticsEnabled, exportRoute, hasAccount, setAnalyticsEnabled]
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

      <View style={styles.dangerSection}>
        <SettingsSection
          title="Danger Zone"
          items={dangerItems}
        />
      </View>
    </ProfileSubpageLayout>
  )
}

const styles = createThemedStyles((theme) => ({
  intro: {
    marginTop: -theme.spacing.sm,
    marginBottom: theme.spacing['3xl'],
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
  },
  dangerSection: {
    marginTop: theme.spacing['3xl'],
  },
}))
