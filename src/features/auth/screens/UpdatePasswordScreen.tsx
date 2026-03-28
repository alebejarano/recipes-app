import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useMemo, useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import Button from '@/components/Button'
import { useAuth } from '@/features/auth/context/AuthContext'
import { createThemedStyles } from '@/styles/createStyles'
import { layout } from '@/styles/layout'

export default function UpdatePasswordScreen() {
  const { isLoading, session, updatePassword } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const canSubmit = useMemo(() => {
    return Boolean(password && confirmPassword && !submitting && session)
  }, [confirmPassword, password, session, submitting])

  const handleSubmit = async () => {
    if (!session) {
      setError('This recovery link is invalid or has expired. Request a new password reset email.')
      return
    }

    if (!password || !confirmPassword) {
      setError('Enter and confirm your new password.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await updatePassword(password)
      setSaved(true)
      setPassword('')
      setConfirmPassword('')
    } catch (submitError: any) {
      setError(submitError?.message ?? 'Unable to update your password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()} style={styles.backRow}>
            <Feather name="arrow-left" size={18} style={styles.backIcon} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.iconWrapper}>
              <Feather name="lock" size={24} style={styles.icon} />
            </View>

            <Text style={styles.title}>Set a new password</Text>
            <Text style={styles.subtitle}>
              Choose a new password for your account. This screen works after opening the reset link
              from your email.
            </Text>
          </View>

          {!isLoading && !session ? (
            <View style={styles.noticeCard}>
              <Text style={styles.noticeTitle}>Recovery link needed</Text>
              <Text style={styles.noticeText}>
                Open the reset email on this device, or request a fresh password reset link from
                the app.
              </Text>

              <Button onPress={() => router.replace('/(public)/forgot-password')} style={styles.submitButton}>
                Request new link
              </Button>
            </View>
          ) : (
            <>
              <View style={styles.field}>
                <Text style={styles.label}>New password</Text>
                <View style={styles.inputWrapper}>
                  <Feather name="lock" size={18} style={styles.inputIcon} />
                  <TextInput
                    placeholder="Enter a new password"
                    placeholderTextColor="#8c857b"
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                  />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Confirm password</Text>
                <View style={styles.inputWrapper}>
                  <Feather name="check-circle" size={18} style={styles.inputIcon} />
                  <TextInput
                    placeholder="Re-enter your new password"
                    placeholderTextColor="#8c857b"
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                </View>
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              {saved ? (
                <Text style={styles.successText}>
                  Password updated. You can continue using your account with the new password.
                </Text>
              ) : null}

              <Button
                onPress={() => {
                  void handleSubmit()
                }}
                loading={submitting}
                disabled={!canSubmit}
                style={styles.submitButton}
              >
                Update password
              </Button>

              {saved ? (
                <Button
                  variant="secondary"
                  onPress={() => router.replace('/(auth)/(tabs)/profile')}
                  style={styles.secondaryButton}
                >
                  Return to profile
                </Button>
              ) : null}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = createThemedStyles((theme) => ({
  flex: { flex: 1 },
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: layout.screenPadding,
    paddingVertical: theme.spacing.xl,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  backIcon: {
    color: theme.colors.warmGray,
    marginRight: theme.spacing.xs,
    fontSize: theme.fontSize.lg,
  },
  backText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.lg,
    color: theme.colors.warmGray,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: theme.radii.xl,
    backgroundColor: theme.colors.creamDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  icon: {
    color: theme.colors.primary,
  },
  title: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.display,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
  },
  noticeCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.xl,
    padding: layout.cardPadding,
    gap: layout.cardGap,
  },
  noticeTitle: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.xl,
    color: theme.colors.foreground,
  },
  noticeText: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
  },
  field: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  label: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.sm,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.radii.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.inputBackground,
    height: 52,
    paddingHorizontal: theme.spacing.md,
  },
  inputIcon: {
    color: theme.colors.mutedForeground,
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    color: theme.colors.foreground,
  },
  errorText: {
    marginTop: theme.spacing.md,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.destructive,
    textAlign: 'center',
  },
  successText: {
    marginTop: theme.spacing.md,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.primary,
    textAlign: 'center',
  },
  submitButton: {
    marginTop: theme.spacing.lg,
    width: '100%',
  },
  secondaryButton: {
    marginTop: theme.spacing.sm,
  },
}))
