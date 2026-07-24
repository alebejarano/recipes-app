import { router } from 'expo-router'
import { useCallback, useMemo, useState } from 'react'
import { Alert, Text, View } from 'react-native'

import { useAnalyticsConsent } from '@/features/analytics/context/AnalyticsConsentContext'
import { useAuth } from '@/features/auth/context/AuthContext'
import ProfileSubpageLayout from '@/features/profile/components/ProfileSubpageLayout'
import SettingsSection from '@/features/profile/components/SettingsSection'
import { getUserFacingErrorMessage } from '@/lib/userFacingError'
import { useTranslation } from '@/localization'
import { createThemedStyles } from '@/styles/createStyles'

type PrivacySettingsScreenProps = {
  onBack: () => void
  exportRoute: string
}

export default function PrivacySettingsScreen({ onBack, exportRoute }: PrivacySettingsScreenProps) {
  const { t } = useTranslation()
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
      Alert.alert(t('profile.privacySettings.deleteFailedTitle'), getUserFacingErrorMessage(error))
    } finally {
      setIsDeletingAccount(false)
    }
  }, [deleteAccount, hasAccount, isDeletingAccount, t])

  const onDeleteAccountPress = useCallback(() => {
    if (!hasAccount || isDeletingAccount) return

    Alert.alert(
      t('profile.privacySettings.deleteTitle'),
      t('profile.privacySettings.deleteBody'),
      [
        { text: t('profile.privacySettings.cancel'), style: 'cancel' },
        {
          text: t('profile.privacySettings.deleteAction'),
          style: 'destructive',
          onPress: () => {
            void performDeleteAccount()
          },
        },
      ]
    )
  }, [hasAccount, isDeletingAccount, performDeleteAccount, t])

  const unavailableSubtitle = t('profile.privacySettings.unavailable')
  const settingsItems = useMemo(
    () => [
      {
        id: 'analytics-diagnostics',
        type: 'toggle' as const,
        icon: 'activity' as const,
        title: t('profile.privacySettings.analyticsTitle'),
        subtitle: t('profile.privacySettings.analyticsSubtitle'),
        value: analyticsEnabled,
        onValueChange: setAnalyticsEnabled,
        disabled: !analyticsConsentLoaded,
      },
      {
        id: 'password',
        type: 'link' as const,
        icon: 'lock' as const,
        title: t('profile.privacySettings.passwordTitle'),
        subtitle: hasAccount ? t('profile.privacySettings.passwordSubtitle') : unavailableSubtitle,
        onPress: hasAccount
          ? () => router.push('/(auth)/settings/password')
          : undefined,
        disabled: !hasAccount,
      },
      {
        id: 'export',
        type: 'link' as const,
        icon: 'download' as const,
        title: t('profile.privacySettings.exportTitle'),
        subtitle: hasAccount
          ? t('profile.privacySettings.exportSubtitleAccount')
          : t('profile.privacySettings.exportSubtitleGuest'),
        onPress: () => router.push(exportRoute as any),
      },
      {
        id: 'policy',
        type: 'link' as const,
        icon: 'file-text' as const,
        title: t('profile.privacySettings.policyTitle'),
        subtitle: t('profile.privacySettings.policySubtitle'),
        onPress: () => router.push('/privacy-policy'),
      },
      {
        id: 'terms',
        type: 'link' as const,
        icon: 'file-text' as const,
        title: t('profile.privacySettings.termsTitle'),
        subtitle: t('profile.privacySettings.termsSubtitle'),
        onPress: () => router.push('/(public)/terms'),
      },
      {
        id: 'legal-notice',
        type: 'link' as const,
        icon: 'info' as const,
        title: t('profile.privacySettings.legalTitle'),
        subtitle: t('profile.privacySettings.legalSubtitle'),
        onPress: () => router.push('/(public)/legal-notice' as any),
      },
    ],
    [analyticsConsentLoaded, analyticsEnabled, exportRoute, hasAccount, setAnalyticsEnabled, t, unavailableSubtitle]
  )
  const dangerItems = useMemo(
    () => [
      {
        id: 'delete-account',
        type: 'link' as const,
        icon: 'trash-2' as const,
        title: isDeletingAccount ? t('profile.privacySettings.deleting') : t('profile.privacySettings.deleteTitle'),
        subtitle: hasAccount
          ? t('profile.privacySettings.deleteSubtitle')
          : unavailableSubtitle,
        tone: 'danger' as const,
        onPress: hasAccount && !isDeletingAccount ? onDeleteAccountPress : undefined,
        disabled: !hasAccount || isDeletingAccount,
      },
    ],
    [hasAccount, isDeletingAccount, onDeleteAccountPress, t, unavailableSubtitle]
  )

  return (
    <ProfileSubpageLayout title={t('profile.privacySettings.title')} onBack={onBack}>
      <Text style={styles.intro}>{t('profile.privacySettings.intro')}</Text>

      <SettingsSection
        title={t('profile.privacySettings.settingsTitle')}
        items={settingsItems}
      />

      <View style={styles.dangerSection}>
        <SettingsSection
          title={t('profile.privacySettings.dangerTitle')}
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
    ...theme.textVariants.body,
    color: theme.colors.mutedForeground,
  },
  dangerSection: {
    marginTop: theme.spacing['3xl'],
  },
}))
