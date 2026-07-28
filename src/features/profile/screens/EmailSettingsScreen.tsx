import React, { useCallback, useEffect, useState } from 'react'
import { Alert } from 'react-native'

import { useAuth } from '@/features/auth/context/AuthContext'
import { useTransientSnackbarStore } from '@/features/feedback/store/useTransientSnackbarStore'
import {
  createDefaultEmailPreferences,
  getEmailPreferences,
  type EmailPreferenceKey,
  type EmailPreferences,
  updateEmailPreference,
} from '@/features/profile/api/emailPreferencesRepo'
import ProfileSubpageLayout from '@/features/profile/components/ProfileSubpageLayout'
import SettingsSection from '@/features/profile/components/SettingsSection'
import { getUserFacingErrorMessage } from '@/lib/userFacingError'
import { useTranslation } from '@/localization'

type EmailSettingsScreenProps = {
  onBack: () => void
}

export default function EmailSettingsScreen({ onBack }: EmailSettingsScreenProps) {
  const { locale, t } = useTranslation()
  const { user } = useAuth()
  const showSnackbar = useTransientSnackbarStore((state) => state.show)
  const hasAccountEmail = Boolean(user?.email)
  const [preferences, setPreferences] = useState<EmailPreferences>(createDefaultEmailPreferences)
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!user?.id) return

    let isMounted = true

    void getEmailPreferences()
      .then((nextPreferences) => {
        if (isMounted) setPreferences(nextPreferences)
      })
      .catch((error) => {
        if (isMounted) {
          Alert.alert(t('profile.emailSettings.failedTitle'), getUserFacingErrorMessage(error))
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingPreferences(false)
      })

    return () => {
      isMounted = false
    }
  }, [t, user?.id])

  const formatConsentStatus = useCallback((preference: EmailPreferenceKey) => {
    const value = preferences[preference]
    const timestamp = value.optedIn ? value.optedInAt : value.optedOutAt
    if (!timestamp) return null

    const date = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(timestamp))
    return value.optedIn
      ? t('profile.emailSettings.subscribedOn', { date })
      : t('profile.emailSettings.unsubscribedOn', { date })
  }, [locale, preferences, t])

  const updatePreference = useCallback(
    (key: EmailPreferenceKey, next: boolean) => {
      if (!hasAccountEmail || isLoadingPreferences || isSaving) return

      const previousPreferences = preferences
      setIsSaving(true)

      void updateEmailPreference(key, next)
        .then((updatedPreference) => {
          setPreferences((current) => ({ ...current, [key]: updatedPreference }))
          showSnackbar(t('profile.emailSettings.updated'))
        })
        .catch((e: any) => {
          setPreferences(previousPreferences)
          Alert.alert(t('profile.emailSettings.failedTitle'), getUserFacingErrorMessage(e))
        })
        .finally(() => {
          setIsSaving(false)
        })
    },
    [hasAccountEmail, isLoadingPreferences, isSaving, preferences, showSnackbar, t]
  )

  return (
    <ProfileSubpageLayout title={t('profile.emailSettings.title')} onBack={onBack}>
      <SettingsSection
        title={t('profile.emailSettings.sectionTitle')}
        items={[
          {
            id: 'newsletter',
            type: 'toggle',
            icon: 'mail',
            title: t('profile.emailSettings.weeklyTitle'),
            subtitle: hasAccountEmail
              ? formatConsentStatus('weekly_digest') ?? t('profile.emailSettings.weeklySubtitle')
              : t('profile.emailSettings.noAccount'),
            value: preferences.weekly_digest.optedIn,
            disabled: !hasAccountEmail || isLoadingPreferences || isSaving,
            onValueChange: (next) => updatePreference('weekly_digest', next),
          },
          {
            id: 'tips',
            type: 'toggle',
            icon: 'book-open',
            title: t('profile.emailSettings.tipsTitle'),
            subtitle: hasAccountEmail
              ? formatConsentStatus('cooking_tips') ?? t('profile.emailSettings.tipsSubtitle')
              : t('profile.emailSettings.noAccount'),
            value: preferences.cooking_tips.optedIn,
            disabled: !hasAccountEmail || isLoadingPreferences || isSaving,
            onValueChange: (next) => updatePreference('cooking_tips', next),
          },
        ]}
      />
    </ProfileSubpageLayout>
  )
}
