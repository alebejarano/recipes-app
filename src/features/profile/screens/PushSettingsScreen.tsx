import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert } from 'react-native'

import { type PushPreferences, useAuth } from '@/features/auth/context/AuthContext'
import { useTransientSnackbarStore } from '@/features/feedback/store/useTransientSnackbarStore'
import ProfileSubpageLayout from '@/features/profile/components/ProfileSubpageLayout'
import SettingsSection from '@/features/profile/components/SettingsSection'
import { getUserFacingErrorMessage } from '@/lib/userFacingError'

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
          showSnackbar('Push settings updated')
        })
        .catch((e: any) => {
          setPreferences(previousPreferences)
          Alert.alert('Unable to save push settings', getUserFacingErrorMessage(e))
        })
        .finally(() => {
          setIsSaving(false)
        })
    },
    [hasAccount, isSaving, preferences, showSnackbar, updatePushPreferences]
  )

  return (
    <ProfileSubpageLayout title="Push Settings" onBack={onBack}>
      <SettingsSection
        title="Notifications"
        items={[
          {
            id: 'recipe-reminders',
            type: 'toggle',
            icon: 'bell',
            title: 'Recipe reminders',
            subtitle: hasAccount ? 'Get notified about your cooking plans' : 'Create an account to enable reminders',
            value: preferences.recipeReminders,
            disabled: !hasAccount || isSaving,
            onValueChange: (next) => updatePreference('recipeReminders', next),
          },
          {
            id: 'activity-alerts',
            type: 'toggle',
            icon: 'activity',
            title: 'Product updates',
            subtitle: hasAccount ? 'Important app improvements and releases' : 'Create an account to enable notifications',
            value: preferences.activityAlerts,
            disabled: !hasAccount || isSaving,
            onValueChange: (next) => updatePreference('activityAlerts', next),
          },
        ]}
      />
    </ProfileSubpageLayout>
  )
}
