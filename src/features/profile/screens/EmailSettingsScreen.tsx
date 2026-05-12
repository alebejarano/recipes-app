import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert } from 'react-native'

import { type EmailPreferences, useAuth } from '@/features/auth/context/AuthContext'
import { useTransientSnackbarStore } from '@/features/feedback/store/useTransientSnackbarStore'
import ProfileSubpageLayout from '@/features/profile/components/ProfileSubpageLayout'
import SettingsSection from '@/features/profile/components/SettingsSection'
import { getUserFacingErrorMessage } from '@/lib/userFacingError'

type EmailSettingsScreenProps = {
  onBack: () => void
}

const DEFAULT_EMAIL_PREFERENCES: EmailPreferences = {
  weeklyDigest: false,
  cookingTips: false,
}

function getSavedEmailPreferences(value: unknown): EmailPreferences {
  if (!value || typeof value !== 'object') return DEFAULT_EMAIL_PREFERENCES

  const preferences = value as Partial<Record<keyof EmailPreferences, unknown>>
  return {
    weeklyDigest:
      typeof preferences.weeklyDigest === 'boolean'
        ? preferences.weeklyDigest
        : DEFAULT_EMAIL_PREFERENCES.weeklyDigest,
    cookingTips:
      typeof preferences.cookingTips === 'boolean'
        ? preferences.cookingTips
        : DEFAULT_EMAIL_PREFERENCES.cookingTips,
  }
}

export default function EmailSettingsScreen({ onBack }: EmailSettingsScreenProps) {
  const { updateEmailPreferences, user } = useAuth()
  const showSnackbar = useTransientSnackbarStore((state) => state.show)
  const hasAccountEmail = Boolean(user?.email)
  const savedPreferences = useMemo(
    () => getSavedEmailPreferences(user?.user_metadata?.email_updates),
    [user?.user_metadata?.email_updates]
  )
  const [preferences, setPreferences] = useState<EmailPreferences>(savedPreferences)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setPreferences(savedPreferences)
  }, [savedPreferences])

  const updatePreference = useCallback(
    (key: keyof EmailPreferences, next: boolean) => {
      if (!hasAccountEmail || isSaving) return

      const previousPreferences = preferences
      const nextPreferences = {
        ...previousPreferences,
        [key]: next,
      }

      setPreferences(nextPreferences)
      setIsSaving(true)

      void updateEmailPreferences(nextPreferences)
        .then(() => {
          showSnackbar('Email settings updated')
        })
        .catch((e: any) => {
          setPreferences(previousPreferences)
          Alert.alert('Unable to save email settings', getUserFacingErrorMessage(e))
        })
        .finally(() => {
          setIsSaving(false)
        })
    },
    [hasAccountEmail, isSaving, preferences, showSnackbar, updateEmailPreferences]
  )

  return (
    <ProfileSubpageLayout title="Email Settings" onBack={onBack}>
      <SettingsSection
        title="Email Updates"
        items={[
          {
            id: 'newsletter',
            type: 'toggle',
            icon: 'mail',
            title: 'Weekly digest',
            subtitle: hasAccountEmail ? 'Recipes and curated collections' : 'Create an account to receive emails',
            value: preferences.weeklyDigest,
            disabled: !hasAccountEmail || isSaving,
            onValueChange: (next) => updatePreference('weeklyDigest', next),
          },
          {
            id: 'tips',
            type: 'toggle',
            icon: 'book-open',
            title: 'Cooking tips',
            subtitle: hasAccountEmail ? 'Short guides and feature education' : 'Create an account to receive emails',
            value: preferences.cookingTips,
            disabled: !hasAccountEmail || isSaving,
            onValueChange: (next) => updatePreference('cookingTips', next),
          },
        ]}
      />
    </ProfileSubpageLayout>
  )
}
