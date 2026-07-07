import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert } from 'react-native'

import { type PushPreferences, useAuth } from '@/features/auth/context/AuthContext'
import { useTransientSnackbarStore } from '@/features/feedback/store/useTransientSnackbarStore'
import ProfileSubpageLayout from '@/features/profile/components/ProfileSubpageLayout'
import SettingsSection from '@/features/profile/components/SettingsSection'
import { getUserFacingErrorMessage } from '@/lib/userFacingError'
import { useTranslation } from '@/localization'

type PushSettingsScreenProps = {
  onBack: () => void
}

const DEFAULT_PUSH_PREFERENCES: PushPreferences = {
  recipeReminders: false,
  activityAlerts: false,
}

function getSavedPushPreferences(value: unknown): PushPreferences {
  if (!value || typeof value !== 'object') return DEFAULT_PUSH_PREFERENCES

  const preferences = value as Partial<Record<keyof PushPreferences, unknown>>
  return {
    recipeReminders:
      typeof preferences.recipeReminders === 'boolean'
        ? preferences.recipeReminders
        : DEFAULT_PUSH_PREFERENCES.recipeReminders,
    activityAlerts:
      typeof preferences.activityAlerts === 'boolean'
        ? preferences.activityAlerts
        : DEFAULT_PUSH_PREFERENCES.activityAlerts,
  }
}

export default function PushSettingsScreen({ onBack }: PushSettingsScreenProps) {
  const { t } = useTranslation()
  const { updatePushPreferences, user } = useAuth()
  const showSnackbar = useTransientSnackbarStore((state) => state.show)
  const hasAccount = Boolean(user?.id)
  const savedPreferences = useMemo(
    () => getSavedPushPreferences(user?.user_metadata?.push_notifications),
    [user?.user_metadata?.push_notifications]
  )
  const [preferences, setPreferences] = useState<PushPreferences>(savedPreferences)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setPreferences(savedPreferences)
  }, [savedPreferences])

  const updatePreference = useCallback(
    (key: keyof PushPreferences, next: boolean) => {
      if (!hasAccount || isSaving) return

      const previousPreferences = preferences
      const nextPreferences = {
        ...previousPreferences,
        [key]: next,
      }

      setPreferences(nextPreferences)
      setIsSaving(true)

      void updatePushPreferences(nextPreferences)
        .then(() => {
          showSnackbar(t('profile.pushSettings.updated'))
        })
        .catch((e: any) => {
          setPreferences(previousPreferences)
          Alert.alert(t('profile.pushSettings.failedTitle'), getUserFacingErrorMessage(e))
        })
        .finally(() => {
          setIsSaving(false)
        })
    },
    [hasAccount, isSaving, preferences, showSnackbar, t, updatePushPreferences]
  )

  return (
    <ProfileSubpageLayout title={t('profile.pushSettings.title')} onBack={onBack}>
      <SettingsSection
        title={t('profile.pushSettings.sectionTitle')}
        items={[
          {
            id: 'recipe-reminders',
            type: 'toggle',
            icon: 'bell',
            title: t('profile.pushSettings.remindersTitle'),
            subtitle: hasAccount ? t('profile.pushSettings.remindersSubtitle') : t('profile.pushSettings.noAccountReminders'),
            value: preferences.recipeReminders,
            disabled: !hasAccount || isSaving,
            onValueChange: (next) => updatePreference('recipeReminders', next),
          },
          {
            id: 'activity-alerts',
            type: 'toggle',
            icon: 'activity',
            title: t('profile.pushSettings.updatesTitle'),
            subtitle: hasAccount ? t('profile.pushSettings.updatesSubtitle') : t('profile.pushSettings.noAccountNotifications'),
            value: preferences.activityAlerts,
            disabled: !hasAccount || isSaving,
            onValueChange: (next) => updatePreference('activityAlerts', next),
          },
        ]}
      />
    </ProfileSubpageLayout>
  )
}
