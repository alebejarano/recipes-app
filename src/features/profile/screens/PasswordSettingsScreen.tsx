import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useEffect, useMemo, useState } from 'react'
import { BackHandler, Text, TextInput, TouchableOpacity, View } from 'react-native'

import Button from '@/components/Button'
import Screen from '@/components/Screen'
import { useAuth } from '@/features/auth/context/AuthContext'
import {
  PASSWORD_REQUIREMENTS,
  getPasswordPolicyIssues,
  isPasswordStrong,
} from '@/features/auth/utils/passwordPolicy'
import ProfileSubpageLayout from '@/features/profile/components/ProfileSubpageLayout'
import { getUserFacingErrorMessage } from '@/lib/userFacingError'
import { createThemedStyles } from '@/styles/createStyles'
import { theme } from '@/styles/theme'

type PasswordSettingsScreenProps = {
  onBack: () => void
}

function getPasswordUpdateErrorMessage(error: any) {
  const message = typeof error?.message === 'string' ? error.message : ''
  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes('invalid login credentials')) {
    return 'Current password is incorrect.'
  }

  if (lowerMessage.includes('same_password')) {
    return 'Choose a new password that is different from your current password.'
  }

  return getUserFacingErrorMessage(error, 'Unable to update your password.')
}

export default function PasswordSettingsScreen({ onBack }: PasswordSettingsScreenProps) {
  const { user, updatePasswordWithCurrentPassword, logout } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const email = useMemo(() => user?.email ?? '', [user?.email])
  const passwordPolicyIssues = useMemo(() => getPasswordPolicyIssues(password), [password])
  const passwordMeetsPolicy = useMemo(() => isPasswordStrong(password), [password])
  const passwordsDoNotMatch = Boolean(password && confirmPassword && password !== confirmPassword)
  const canSubmit = Boolean(
    email &&
      currentPassword &&
      passwordMeetsPolicy &&
      confirmPassword &&
      !passwordsDoNotMatch &&
      !isSubmitting
  )

  const handleCurrentPasswordChange = (value: string) => {
    setCurrentPassword(value)
    setError(null)
    setSaved(false)
  }

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

  const handleUpdatePassword = async () => {
    if (!email || isSubmitting) return

    if (!currentPassword) {
      setError('Enter your current password.')
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

    setIsSubmitting(true)
    setError(null)

    try {
      await updatePasswordWithCurrentPassword(currentPassword, password)
      setCurrentPassword('')
      setPassword('')
      setConfirmPassword('')
      setSaved(true)
    } catch (submitError: any) {
      setError(getPasswordUpdateErrorMessage(submitError))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoToSignIn = async () => {
    if (isSigningOut) return

    setIsSigningOut(true)
    try {
      await logout()
    } finally {
      router.replace('/(public)/login')
    }
  }

  useEffect(() => {
    if (!saved) return

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => true)
    return () => subscription.remove()
  }, [saved])

  if (saved) {
    return (
      <Screen scroll={false} contentStyle={styles.successPage}>
        <View style={styles.card}>
          <View style={styles.successIconWrapper}>
            <Feather name="check-circle" size={28} style={styles.successIcon} />
          </View>
          <Text style={styles.successTitle}>Password updated</Text>
          <Text style={styles.successText}>
            Your password was updated successfully. Sign in again with your new password to
            continue.
          </Text>
          <Button
            onPress={() => {
              void handleGoToSignIn()
            }}
            loading={isSigningOut}
            style={styles.button}
          >
            Go to sign in
          </Button>
        </View>
      </Screen>
    )
  }

  return (
    <ProfileSubpageLayout
      title="Password"
      subtitle="Enter your current password before choosing a new one."
      onBack={onBack}
      bottomPadding={180}
      keyboardAware
    >
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Account</Text>
          <Text style={styles.email}>{email || 'No email address found'}</Text>
          <Text style={styles.body}>
            For security, changing your password signs you out. Sign in again with the new
            password to continue.
          </Text>

          <View style={styles.field}>
            <Text style={styles.label}>Current password</Text>
            <View style={styles.inputWrapper}>
              <Feather name="lock" size={18} style={styles.inputIcon} />
              <TextInput
                placeholder="Enter your current password"
                placeholderTextColor={theme.colors.warmGray}
                secureTextEntry={!showCurrentPassword}
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
                value={currentPassword}
                onChangeText={handleCurrentPasswordChange}
                editable={!isSubmitting}
              />
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                onPress={() => setShowCurrentPassword((value) => !value)}
                style={styles.visibilityButton}
                disabled={isSubmitting}
              >
                <Feather
                  name={showCurrentPassword ? 'eye-off' : 'eye'}
                  size={18}
                  style={styles.visibilityIcon}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>New password</Text>
            <View style={styles.inputWrapper}>
              <Feather name="lock" size={18} style={styles.inputIcon} />
              <TextInput
                placeholder="Enter a new password"
                placeholderTextColor={theme.colors.warmGray}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
                value={password}
                onChangeText={handlePasswordChange}
                editable={!isSubmitting}
              />
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                onPress={() => setShowPassword((value) => !value)}
                style={styles.visibilityButton}
                disabled={isSubmitting}
              >
                <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} style={styles.visibilityIcon} />
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
                      style={[styles.requirementIcon, isMet && styles.requirementIconMet]}
                    />
                    <Text style={[styles.requirementText, isMet && styles.requirementTextMet]}>
                      {requirement.label}
                    </Text>
                  </View>
                )
              })}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Confirm password</Text>
            <View style={[styles.inputWrapper, passwordsDoNotMatch && styles.inputWrapperError]}>
              <Feather name="check-circle" size={18} style={styles.inputIcon} />
              <TextInput
                placeholder="Re-enter your new password"
                placeholderTextColor={theme.colors.warmGray}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
                value={confirmPassword}
                onChangeText={handleConfirmPasswordChange}
                editable={!isSubmitting}
              />
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={
                  showConfirmPassword ? 'Hide confirmed password' : 'Show confirmed password'
                }
                onPress={() => setShowConfirmPassword((value) => !value)}
                style={styles.visibilityButton}
                disabled={isSubmitting}
              >
                <Feather
                  name={showConfirmPassword ? 'eye-off' : 'eye'}
                  size={18}
                  style={styles.visibilityIcon}
                />
              </TouchableOpacity>
            </View>
            {passwordsDoNotMatch ? <Text style={styles.fieldError}>Passwords do not match.</Text> : null}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <Button
            onPress={() => {
              void handleUpdatePassword()
            }}
            loading={isSubmitting}
            disabled={!canSubmit}
            style={styles.button}
          >
            Update password
          </Button>
        </View>
    </ProfileSubpageLayout>
  )
}

const styles = createThemedStyles((theme) => ({
  successPage: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  card: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.xl,
    backgroundColor: theme.colors.card,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  sectionLabel: {
    ...theme.textVariants.labelSmall,
    color: theme.colors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  email: {
    ...theme.textVariants.heading,
    color: theme.colors.foreground,
  },
  body: {
    ...theme.textVariants.body,
    color: theme.colors.mutedForeground,
  },
  field: {
    gap: theme.spacing.xs,
  },
  label: {
    ...theme.textVariants.labelSmall,
    color: theme.colors.foreground,
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
  inputWrapperError: {
    borderColor: theme.colors.destructive,
  },
  inputIcon: {
    color: theme.colors.mutedForeground,
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    ...theme.textVariants.body,
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
  successIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: theme.radii.xl,
    backgroundColor: theme.colors.creamDark,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  successIcon: {
    color: theme.colors.primary,
  },
  successTitle: {
    ...theme.textVariants.heading,
    color: theme.colors.foreground,
    textAlign: 'center',
  },
  requirementsCard: {
    marginTop: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  requirementsTitle: {
    ...theme.textVariants.labelSmall,
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
    ...theme.textVariants.caption,
    color: theme.colors.mutedForeground,
  },
  requirementTextMet: {
    color: theme.colors.foreground,
  },
  errorText: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.destructive,
    textAlign: 'center',
  },
  successText: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.primary,
    textAlign: 'center',
  },
  fieldError: {
    ...theme.textVariants.caption,
    color: theme.colors.destructive,
  },
  button: {
    marginTop: theme.spacing.xs,
  },
}))
