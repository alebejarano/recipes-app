import React, { useMemo, useState } from 'react'
import { Alert, Text, View } from 'react-native'

import Button from '@/components/Button'
import { useAuth } from '@/features/auth/context/AuthContext'
import ProfileSubpageLayout from '@/features/profile/components/ProfileSubpageLayout'
import { createThemedStyles } from '@/styles/createStyles'

type PasswordSettingsScreenProps = {
  onBack: () => void
}

export default function PasswordSettingsScreen({ onBack }: PasswordSettingsScreenProps) {
  const { user, sendPasswordResetEmail } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const email = useMemo(() => user?.email ?? '', [user?.email])

  const handleSendResetLink = async () => {
    if (!email || isSubmitting) return

    setIsSubmitting(true)
    try {
      await sendPasswordResetEmail(email)
      Alert.alert(
        'Check your email',
        `We sent a password reset link to ${email}. Open it on this device to choose a new password.`
      )
    } catch (error: any) {
      Alert.alert('Unable to send link', error?.message ?? 'Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ProfileSubpageLayout
      title="Password"
      subtitle="Send yourself a secure reset link to change your password."
      onBack={onBack}
    >
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Reset email</Text>
        <Text style={styles.email}>{email || 'No email address found'}</Text>
        <Text style={styles.body}>
          For security, password changes happen from the recovery link Supabase emails you. The
          link opens this app and lets you set a new password without signing out first.
        </Text>

        <Button
          onPress={() => {
            void handleSendResetLink()
          }}
          loading={isSubmitting}
          disabled={!email}
          style={styles.button}
        >
          Send password reset link
        </Button>

        <Text style={styles.caption}>
          If the email lands on another device, open the link there and then return to this app.
        </Text>
      </View>
    </ProfileSubpageLayout>
  )
}

const styles = createThemedStyles((theme) => ({
  card: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.xl,
    backgroundColor: theme.colors.card,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  sectionLabel: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  email: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.xl,
    lineHeight: theme.lineHeight.xl,
    color: theme.colors.foreground,
  },
  body: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
  },
  button: {
    marginTop: theme.spacing.xs,
  },
  caption: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.xs,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.mutedForeground,
  },
}))
