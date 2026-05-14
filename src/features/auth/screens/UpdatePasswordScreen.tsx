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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

import Button from '@/components/Button'
import { useAuth } from '@/features/auth/context/AuthContext'
import {
  PASSWORD_REQUIREMENTS,
  getPasswordPolicyIssues,
  isPasswordStrong,
} from '@/features/auth/utils/passwordPolicy'
import { useLargeScreenLayout } from '@/hooks/useLargeScreenLayout'
import { getUserFacingErrorMessage } from '@/lib/userFacingError'
import { createThemedStyles } from '@/styles/createStyles'
import { layout } from '@/styles/layout'

const KEYBOARD_SCROLL_PADDING = 96

export default function UpdatePasswordScreen() {
  const insets = useSafeAreaInsets()
  const largeScreen = useLargeScreenLayout({ maxContentWidth: layout.authContentMaxWidth })
  const { isLoading, session, updatePassword } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const passwordPolicyIssues = useMemo(() => getPasswordPolicyIssues(password), [password])
  const passwordMeetsPolicy = useMemo(() => isPasswordStrong(password), [password])

  const canSubmit = useMemo(() => {
    return Boolean(passwordMeetsPolicy && confirmPassword && !submitting && session)
  }, [confirmPassword, passwordMeetsPolicy, session, submitting])

  const keyboardVerticalOffset = Platform.select({
    ios: insets.top,
    android: 0,
  })

  const handlePasswordChange = (value: string) => {
    setPassword(value)
    setError(null)
    setSaved(false)
  }

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value)
    setError(null)
    setSaved(false)
  }

  const handleSubmit = async () => {
    if (!session) {
      setError('This recovery link is invalid or has expired. Request a new password reset email.')
      return
    }

    if (!password || !confirmPassword) {
      setError('Enter and confirm your new password.')
      return
    }

    if (passwordPolicyIssues.length > 0) {
      setError('Choose a stronger password before continuing.')
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
    } catch (submitError) {
      setError(getUserFacingErrorMessage(submitError, 'Unable to update your password.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.content,
            largeScreen.pagePaddingStyle,
            { paddingBottom: insets.bottom + KEYBOARD_SCROLL_PADDING },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets
        >
          <View style={largeScreen.contentWidthStyle}>
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
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.input}
                    value={password}
                    onChangeText={handlePasswordChange}
                  />
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                    onPress={() => setShowPassword((value) => !value)}
                    style={styles.visibilityButton}
                  >
                    <Feather
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={18}
                      style={styles.visibilityIcon}
                    />
                  </TouchableOpacity>
                </View>
                <View style={styles.requirementsCard}>
                  <Text style={styles.requirementsTitle}>Password must include:</Text>
                  {PASSWORD_REQUIREMENTS.map((requirement) => {
                    const isMet = requirement.validate(password)

                    return (
                      <View key={requirement.id} style={styles.requirementRow}>
                        <Feather
                          name={isMet ? 'check-circle' : 'circle'}
                          size={16}
                          style={[
                            styles.requirementIcon,
                            isMet && styles.requirementIconMet,
                          ]}
                        />
                        <Text
                          style={[
                            styles.requirementText,
                            isMet && styles.requirementTextMet,
                          ]}
                        >
                          {requirement.label}
                        </Text>
                      </View>
                    )
                  })}
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Confirm password</Text>
                <View style={styles.inputWrapper}>
                  <Feather name="check-circle" size={18} style={styles.inputIcon} />
                  <TextInput
                    placeholder="Re-enter your new password"
                    placeholderTextColor="#8c857b"
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={handleConfirmPasswordChange}
                  />
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={
                      showConfirmPassword ? 'Hide confirmed password' : 'Show confirmed password'
                    }
                    onPress={() => setShowConfirmPassword((value) => !value)}
                    style={styles.visibilityButton}
                  >
                    <Feather
                      name={showConfirmPassword ? 'eye-off' : 'eye'}
                      size={18}
                      style={styles.visibilityIcon}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              {saved ? (
                <Text style={styles.successText}>
                  Password updated. Sign in again with your new password to continue.
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
                  onPress={() => router.replace('/(public)/login')}
                  style={styles.secondaryButton}
                >
                  Go to sign in
                </Button>
              ) : null}
            </>
          )}
          </View>
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
    minHeight: 44,
    paddingVertical: theme.spacing.sm,
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
  visibilityButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.xs,
  },
  visibilityIcon: {
    color: theme.colors.mutedForeground,
  },
  requirementsCard: {
    marginTop: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  requirementsTitle: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  requirementIcon: {
    color: theme.colors.mutedForeground,
  },
  requirementIconMet: {
    color: theme.colors.primary,
  },
  requirementText: {
    flex: 1,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.mutedForeground,
  },
  requirementTextMet: {
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
