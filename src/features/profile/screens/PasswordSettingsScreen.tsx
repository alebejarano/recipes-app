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
import { useTranslation } from '@/localization'
import { createThemedStyles } from '@/styles/createStyles'
import { theme } from '@/styles/theme'

type PasswordSettingsScreenProps = {
  onBack: () => void
}

function getPasswordUpdateErrorMessage(
  error: any,
  t: (scope: string, params?: Record<string, string | number | boolean | null | undefined>) => string
) {
  const message = typeof error?.message === 'string' ? error.message : ''
  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes('invalid login credentials')) {
    return t('profile.passwordSettings.invalidCurrent')
  }

  if (lowerMessage.includes('same_password')) {
    return t('profile.passwordSettings.samePassword')
  }

  if (error?.code === 'reauthentication_not_valid' || error?.code === 'otp_expired') {
    return t('profile.passwordSettings.invalidReauthenticationCode')
  }

  return getUserFacingErrorMessage(error, t('profile.passwordSettings.updateFailed'))
}

function requiresPasswordReauthentication(error: any) {
  const code = typeof error?.code === 'string' ? error.code : ''
  const message = typeof error?.message === 'string' ? error.message.toLowerCase() : ''

  return (
    code === 'reauth_nonce_missing' ||
    code === 'reauthentication_needed' ||
    message.includes('reauthentication required') ||
    message.includes('reauthentication needed')
  )
}

export default function PasswordSettingsScreen({ onBack }: PasswordSettingsScreenProps) {
  const { t } = useTranslation()
  const { user, requestPasswordReauthentication, updatePasswordWithCurrentPassword, logout } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [reauthenticationCode, setReauthenticationCode] = useState('')
  const [requiresReauthentication, setRequiresReauthentication] = useState(false)
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
      (!requiresReauthentication || reauthenticationCode) &&
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

  const handleReauthenticationCodeChange = (value: string) => {
    setReauthenticationCode(value.replace(/\D/g, ''))
    setError(null)
  }

  const handleUpdatePassword = async () => {
    if (!email || isSubmitting) return

    if (!currentPassword) {
      setError(t('profile.passwordSettings.missingCurrent'))
      return
    }

    if (!password || !confirmPassword) {
      setError(t('profile.passwordSettings.missingNew'))
      return
    }

    if (passwordPolicyIssues.length > 0) {
      setError(t('profile.passwordSettings.weak'))
      return
    }

    if (password !== confirmPassword) {
      setError(t('profile.passwordSettings.mismatch'))
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await updatePasswordWithCurrentPassword(
        currentPassword,
        password,
        requiresReauthentication ? reauthenticationCode : undefined
      )
      setCurrentPassword('')
      setPassword('')
      setConfirmPassword('')
      setReauthenticationCode('')
      setSaved(true)
    } catch (submitError: any) {
      if (!requiresReauthentication && requiresPasswordReauthentication(submitError)) {
        try {
          await requestPasswordReauthentication()
          setRequiresReauthentication(true)
          setReauthenticationCode('')
          return
        } catch (reauthenticationError: any) {
          setError(getPasswordUpdateErrorMessage(reauthenticationError, t))
          return
        }
      }

      setError(getPasswordUpdateErrorMessage(submitError, t))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResendReauthenticationCode = async () => {
    if (isSubmitting) return

    setIsSubmitting(true)
    setError(null)
    try {
      await requestPasswordReauthentication()
      setReauthenticationCode('')
    } catch (reauthenticationError: any) {
      setError(getPasswordUpdateErrorMessage(reauthenticationError, t))
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
          <Text style={styles.successTitle}>{t('profile.passwordSettings.successTitle')}</Text>
          <Text style={styles.successText}>{t('profile.passwordSettings.successBody')}</Text>
          <Button
            onPress={() => {
              void handleGoToSignIn()
            }}
            loading={isSigningOut}
            style={styles.button}
          >
            {t('profile.passwordSettings.goToSignIn')}
          </Button>
        </View>
      </Screen>
    )
  }

  return (
    <ProfileSubpageLayout
      title={t('profile.passwordSettings.title')}
      subtitle={t('profile.passwordSettings.subtitle')}
      onBack={onBack}
      bottomPadding={180}
      keyboardAware
    >
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>{t('profile.passwordSettings.accountLabel')}</Text>
          <Text style={styles.email}>{email || t('profile.passwordSettings.missingEmail')}</Text>
          <Text style={styles.body}>{t('profile.passwordSettings.body')}</Text>

          <View style={styles.field}>
            <Text style={styles.label}>{t('profile.passwordSettings.currentLabel')}</Text>
            <View style={styles.inputWrapper}>
              <Feather name="lock" size={18} style={styles.inputIcon} />
              <TextInput
                placeholder={t('profile.passwordSettings.currentPlaceholder')}
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
                accessibilityLabel={
                  showCurrentPassword
                    ? t('profile.passwordSettings.hideCurrent')
                    : t('profile.passwordSettings.showCurrent')
                }
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
            <Text style={styles.label}>{t('profile.passwordSettings.newLabel')}</Text>
            <View style={styles.inputWrapper}>
              <Feather name="lock" size={18} style={styles.inputIcon} />
              <TextInput
                placeholder={t('profile.passwordSettings.newPlaceholder')}
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
                accessibilityLabel={
                  showPassword
                    ? t('profile.passwordSettings.hidePassword')
                    : t('profile.passwordSettings.showPassword')
                }
                onPress={() => setShowPassword((value) => !value)}
                style={styles.visibilityButton}
                disabled={isSubmitting}
              >
                <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} style={styles.visibilityIcon} />
              </TouchableOpacity>
            </View>

            <View style={styles.requirementsCard}>
              <Text style={styles.requirementsTitle}>{t('profile.passwordSettings.requirementsTitle')}</Text>
              {PASSWORD_REQUIREMENTS.map((requirement) => {
                const isMet = requirement.validate(password)
                const requirementLabel =
                  requirement.id === 'length'
                    ? t('profile.passwordSettings.requirementLength')
                    : t('profile.passwordSettings.requirementLetterNumber')

                return (
                  <View key={requirement.id} style={styles.requirementRow}>
                    <Feather
                      name={isMet ? 'check-circle' : 'circle'}
                      size={16}
                      style={[styles.requirementIcon, isMet && styles.requirementIconMet]}
                    />
                    <Text style={[styles.requirementText, isMet && styles.requirementTextMet]}>
                      {requirementLabel}
                    </Text>
                  </View>
                )
              })}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t('profile.passwordSettings.confirmLabel')}</Text>
            <View style={[styles.inputWrapper, passwordsDoNotMatch && styles.inputWrapperError]}>
              <Feather name="check-circle" size={18} style={styles.inputIcon} />
              <TextInput
                placeholder={t('profile.passwordSettings.confirmPlaceholder')}
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
                  showConfirmPassword
                    ? t('profile.passwordSettings.hideConfirm')
                    : t('profile.passwordSettings.showConfirm')
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
            {passwordsDoNotMatch ? (
              <Text style={styles.fieldError}>{t('profile.passwordSettings.mismatch')}</Text>
            ) : null}
          </View>

          {requiresReauthentication ? (
            <View style={styles.reauthenticationCard}>
              <Text style={styles.reauthenticationTitle}>{t('profile.passwordSettings.reauthenticationTitle')}</Text>
              <Text style={styles.reauthenticationBody}>{t('profile.passwordSettings.reauthenticationBody')}</Text>
              <View style={styles.field}>
                <Text style={styles.label}>{t('profile.passwordSettings.reauthenticationCodeLabel')}</Text>
                <View style={styles.inputWrapper}>
                  <Feather name="shield" size={18} style={styles.inputIcon} />
                  <TextInput
                    placeholder={t('profile.passwordSettings.reauthenticationCodePlaceholder')}
                    placeholderTextColor={theme.colors.warmGray}
                    keyboardType="number-pad"
                    autoComplete="one-time-code"
                    textContentType="oneTimeCode"
                    maxLength={8}
                    style={styles.input}
                    value={reauthenticationCode}
                    onChangeText={handleReauthenticationCodeChange}
                    editable={!isSubmitting}
                  />
                </View>
              </View>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={t('profile.passwordSettings.resendReauthenticationCode')}
                onPress={() => {
                  void handleResendReauthenticationCode()
                }}
                disabled={isSubmitting}
              >
                <Text style={styles.resendCodeText}>{t('profile.passwordSettings.resendReauthenticationCode')}</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <Button
            onPress={() => {
              void handleUpdatePassword()
            }}
            loading={isSubmitting}
            disabled={!canSubmit}
            style={styles.button}
          >
            {t('profile.passwordSettings.update')}
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
  reauthenticationCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  reauthenticationTitle: {
    ...theme.textVariants.labelSmall,
    color: theme.colors.foreground,
  },
  reauthenticationBody: {
    ...theme.textVariants.caption,
    color: theme.colors.mutedForeground,
  },
  resendCodeText: {
    ...theme.textVariants.caption,
    color: theme.colors.primary,
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
