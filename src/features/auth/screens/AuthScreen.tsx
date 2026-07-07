import { Feather } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React, { useMemo, useState } from 'react'
import {
  Image,
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
import { useAnalyticsCapture } from '@/features/analytics/events'
import { useAuth } from '@/features/auth/context/AuthContext'
import { isValidEmail, normalizeEmail } from '@/features/auth/utils/email'
import {
  PASSWORD_REQUIREMENTS,
  getPasswordPolicyIssues,
  isPasswordStrong,
} from '@/features/auth/utils/passwordPolicy'
import { getUserFacingErrorMessage } from '@/lib/userFacingError'
import { useLargeScreenLayout } from '@/hooks/useLargeScreenLayout'
import { useTranslation } from '@/localization'
import { createThemedStyles } from '@/styles/createStyles'
import { layout } from '@/styles/layout'
import { theme } from '@/styles/theme'

export type AuthMode = 'login' | 'register'

type AuthScreenProps = {
  initialMode: AuthMode
}

type SubmitError = {
  title: string
  message: string
} | null

const KEYBOARD_SCROLL_PADDING = 96

export default function AuthScreen({ initialMode }: AuthScreenProps) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const largeScreen = useLargeScreenLayout({ maxContentWidth: layout.authContentMaxWidth })
  const { login, register } = useAuth()
  const captureAnalyticsEvent = useAnalyticsCapture()
  const { t } = useTranslation()

  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [acceptedLegalTerms, setAcceptedLegalTerms] = useState(false)

  const [error, setError] = useState<SubmitError>(null)
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false)

  const isLogin = mode === 'login'

  const keyboardVerticalOffset = Platform.select({
    ios: insets.top,
    android: 0,
  })

  const emailError = useMemo(() => {
    const normalizedEmail = normalizeEmail(email)
    if (isLogin || !normalizedEmail || isValidEmail(normalizedEmail)) return null
    return t('auth.errors.invalidEmailInline')
  }, [email, isLogin, t])

  const confirmPasswordError = useMemo(() => {
    if (isLogin || !confirmPassword || password === confirmPassword) return null
    return t('auth.errors.passwordMismatchInline')
  }, [confirmPassword, isLogin, password, t])

  const passwordPolicyIssues = useMemo(() => getPasswordPolicyIssues(password), [password])
  const passwordMeetsPolicy = useMemo(() => isPasswordStrong(password), [password])

  const canSubmit = useMemo(() => {
    const normalizedEmail = normalizeEmail(email)
    if (!normalizedEmail) return false
    if (!isLogin && !isValidEmail(normalizedEmail)) return false
    if (!password) return false
    if (!isLogin) {
      if (!passwordMeetsPolicy) return false
      if (!confirmPassword) return false
      if (password !== confirmPassword) return false
      if (!acceptedLegalTerms) return false
    }
    return true
  }, [email, password, confirmPassword, isLogin, passwordMeetsPolicy, acceptedLegalTerms])

  const resetTransientState = () => {
    setError(null)
    setNeedsEmailConfirmation(false)
  }

  const handleSubmit = async () => {
    resetTransientState()
    const normalizedEmail = normalizeEmail(email)

    // Basic client-side validation (keep it simple; Supabase will validate too)
    if (!normalizedEmail || !password) return

    if (!isLogin && !isValidEmail(normalizedEmail)) {
      setError({ title: t('auth.errors.invalidEmailTitle'), message: t('auth.errors.invalidEmailMessage') })
      return
    }

    if (!isLogin && !confirmPassword) {
      setError({ title: t('auth.errors.missingFieldTitle'), message: t('auth.errors.missingConfirmPassword') })
      return
    }

    if (!isLogin && passwordPolicyIssues.length > 0) {
      setError({
        title: t('auth.errors.weakPasswordTitle'),
        message: t('auth.errors.weakPasswordMessage'),
      })
      return
    }

    if (!isLogin && password !== confirmPassword) {
      setError({ title: t('auth.errors.passwordMismatchTitle'), message: t('auth.errors.passwordMismatchMessage') })
      return
    }

    if (!isLogin && !acceptedLegalTerms) {
      setError({
        title: t('auth.errors.agreementRequiredTitle'),
        message: t('auth.errors.agreementRequiredMessage'),
      })
      return
    }

    setLoading(true)

    try {
      if (isLogin) {
        await login(normalizedEmail, password)
        // Do NOT hard-redirect here if you rely on layout guards.
        // But it is fine to route immediately for snappier UX.
        router.replace('/(auth)/(tabs)')
        return
      }

      // Register
      const data = await register(normalizedEmail, password)
      captureAnalyticsEvent('sign_up_completed', { method: 'email' })

      // If email confirmations are enabled, session may be null.
      if (!data.session) {
        setNeedsEmailConfirmation(true)
        return
      }

      // If we have a session, the user is authenticated.
      router.replace('/(auth)/(tabs)')
    } catch (e) {
      setError({
        title: isLogin ? t('auth.errors.signInFailed') : t('auth.errors.registrationFailed'),
        message: getUserFacingErrorMessage(e, t('auth.errors.generic')),
      })
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = () => {
    const normalizedEmail = normalizeEmail(email)

    router.push({
      pathname: '/(public)/forgot-password',
      params: normalizedEmail ? { email: normalizedEmail } : undefined,
    })
  }

  const goBackToGetStarted = () => {
    router.replace('/(public)/get-started')
  }

  const toggleMode = () => {
    resetTransientState()
    setMode(isLogin ? 'register' : 'login')
  }

  if (needsEmailConfirmation) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.content, largeScreen.pagePaddingStyle, styles.confirmWrap]}>
          <View style={largeScreen.contentWidthStyle}>
          <View style={styles.header}>
            <View style={styles.iconWrapper}>
              <Text style={styles.emoji}>✉️</Text>
            </View>

            <Text style={styles.title}>{t('auth.screen.confirmEmailTitle')}</Text>

            <Text style={styles.subtitle}>
              {t('auth.screen.confirmEmailMessage', { email: email.trim() })}
            </Text>
          </View>

          <Button
            onPress={() => {
              setNeedsEmailConfirmation(false)
              setMode('login')
            }}
            size="lg"
            style={styles.submitButton}
          >
            {t('auth.shared.actions.goToSignIn')}
          </Button>

          <TouchableOpacity onPress={goBackToGetStarted} style={styles.notNowLink}>
            <Text style={styles.notNowText}>{t('auth.shared.actions.back')}</Text>
          </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    )
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
          {/* Header */}
          <View style={styles.header}>
            <Image
              source={require('@assets/images/logo-mark-transparent.png')}
              style={styles.logo}
              resizeMode="contain"
            />

            <Text style={styles.title}>{isLogin ? t('auth.screen.loginTitle') : t('auth.screen.registerTitle')}</Text>

            <Text style={styles.subtitle}>
              {isLogin ? t('auth.screen.loginSubtitle') : t('auth.screen.registerSubtitle')}
            </Text>
          </View>

          {/* Inline error */}
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorTitle}>{error.title}</Text>
              <Text style={styles.errorMessage}>{error.message}</Text>
            </View>
          ) : null}

          {/* Email */}
          <View style={styles.field}>
            <Text style={styles.label}>{t('auth.shared.emailLabel')}</Text>
            <View style={[styles.inputWrapper, emailError && styles.inputWrapperError]}>
              <Feather name="mail" size={18} style={styles.inputIcon} />
              <TextInput
                placeholder={t('auth.shared.emailPlaceholder')}
                placeholderTextColor={theme.colors.warmGray}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                editable={!loading}
              />
            </View>
            {emailError ? <Text style={styles.fieldError}>{emailError}</Text> : null}
          </View>

          {/* Password */}
          <View style={styles.field}>
            <Text style={styles.label}>{t('auth.shared.passwordLabel')}</Text>

            <View style={styles.inputWrapper}>
              <Feather name="lock" size={18} style={styles.inputIcon} />

              <TextInput
                placeholder={t('auth.shared.passwordPlaceholder')}
                placeholderTextColor={theme.colors.warmGray}
                secureTextEntry={!showPassword}
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                editable={!loading}
              />

              <TouchableOpacity
                onPress={() => setShowPassword((v) => !v)}
                style={styles.eyeButton}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? t('auth.shared.actions.hidePassword') : t('auth.shared.actions.showPassword')}
              >
                <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} style={styles.eyeIcon} />
              </TouchableOpacity>
            </View>

            {!isLogin ? (
              <View style={styles.requirementsCard}>
                <Text style={styles.requirementsTitle}>{t('auth.shared.passwordRequirementsTitle')}</Text>
                {PASSWORD_REQUIREMENTS.map((requirement) => {
                  const isMet = requirement.validate(password)
                  const requirementLabel =
                    requirement.id === 'length'
                      ? t('auth.shared.passwordRequirementLength')
                      : t('auth.shared.passwordRequirementLetterNumber')

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
            ) : null}
          </View>

          {/* Confirm Password (register only) */}
          {!isLogin && (
            <View style={styles.field}>
              <Text style={styles.label}>{t('auth.screen.confirmPasswordLabel')}</Text>

              <View style={[styles.inputWrapper, confirmPasswordError && styles.inputWrapperError]}>
                <Feather name="lock" size={18} style={styles.inputIcon} />

                <TextInput
                  placeholder={t('auth.shared.passwordPlaceholder')}
                  placeholderTextColor={theme.colors.warmGray}
                  secureTextEntry={!showPassword}
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  editable={!loading}
                />
              </View>
              {confirmPasswordError ? <Text style={styles.fieldError}>{confirmPasswordError}</Text> : null}
            </View>
          )}

          {/* Forgot password — login only */}
          {isLogin && (
            <TouchableOpacity style={styles.forgotRow} onPress={handleForgotPassword} disabled={loading}>
              <Text style={styles.forgotText}>{t('auth.screen.forgotPassword')}</Text>
            </TouchableOpacity>
          )}

          {!isLogin ? (
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={loading}
              onPress={() => setAcceptedLegalTerms((value) => !value)}
              style={styles.legalConsentRow}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: acceptedLegalTerms, disabled: loading }}
            >
              <View style={[styles.legalCheckbox, acceptedLegalTerms && styles.legalCheckboxSelected]}>
                {acceptedLegalTerms ? (
                  <Feather name="check" size={14} style={styles.legalCheckboxIcon} />
                ) : null}
              </View>

              <Text style={styles.legalConsentText}>
                {t('auth.screen.legalPrefix')}
                <Text
                  style={styles.legalConsentLink}
                  onPress={() => router.push('/(public)/terms')}
                >
                  {t('auth.legal.termsTitle')}
                </Text>
                {t('auth.screen.legalMiddle')}
                <Text
                  style={styles.legalConsentLink}
                  onPress={() => router.push('/(public)/privacy-policy')}
                >
                  {t('auth.legal.privacyPolicyTitle')}
                </Text>
                {t('auth.screen.legalSuffix')}
              </Text>
            </TouchableOpacity>
          ) : null}

          {/* Submit button */}
          <Button
            onPress={handleSubmit}
            disabled={loading || !canSubmit}
            size="lg"
            style={[styles.submitButton, (!canSubmit || loading) && styles.submitButtonDisabled]}
          >
            {loading ? '...' : isLogin ? t('auth.shared.actions.signIn') : t('auth.shared.actions.createAccount')}
          </Button>

          {/* Toggle login/register */}
          <View style={styles.toggleRow}>
            <Text style={styles.toggleText}>
              {isLogin ? t('auth.screen.toggleToRegisterPrompt') : t('auth.screen.toggleToLoginPrompt')}
            </Text>

            <TouchableOpacity onPress={toggleMode} disabled={loading}>
              <Text style={styles.toggleAction}>{isLogin ? t('auth.shared.actions.signUp') : t('auth.shared.actions.signIn')}</Text>
            </TouchableOpacity>
          </View>
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

  confirmWrap: {
    justifyContent: 'center',
  },

  /* Header */
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

  emoji: {
    fontSize: 28,
  },

  logo: {
    width: 160,
    height: 160,
    marginBottom: theme.spacing.lg,
    marginTop: theme.spacing.xl,
  },

  title: {
    ...theme.textVariants.display,
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
    maxWidth: 420,
  },

  inlineStrong: {
    fontFamily: theme.fontFamily.medium,
    color: theme.colors.foreground,
  },

  /* Error box */
  errorBox: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.xl,
    padding: layout.cardPadding,
    marginBottom: theme.spacing.lg,
  },

  errorTitle: {
    ...theme.textVariants.emphasis,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },

  errorMessage: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
  },

  /* Field */
  field: {
    marginBottom: theme.spacing.lg,
  },

  label: {
    ...theme.textVariants.labelSmall,
    marginBottom: theme.spacing.xs,
    color: theme.colors.foreground,
  },

  /* Input wrapper */
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

  eyeButton: {
    paddingHorizontal: theme.spacing.xs,
  },

  eyeIcon: {
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

  fieldError: {
    ...theme.textVariants.caption,
    color: theme.colors.destructive,
    marginTop: theme.spacing.xs,
  },

  /* Forgot */
  forgotRow: {
    alignItems: 'flex-end',
    marginBottom: theme.spacing.md,
  },

  forgotText: {
    ...theme.textVariants.labelSmall,
    color: theme.colors.primary,
  },

  legalConsentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },

  legalCheckbox: {
    width: 22,
    height: 22,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },

  legalCheckboxSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },

  legalCheckboxIcon: {
    color: theme.colors.primaryForeground,
  },

  legalConsentText: {
    flex: 1,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
  },

  legalConsentLink: {
    fontFamily: theme.fontFamily.medium,
    color: theme.colors.primary,
  },

  /* Button */
  submitButton: {
    width: '100%',
    marginTop: theme.spacing.md,
  },

  submitButtonDisabled: {
    opacity: 0.7,
  },

  /* Toggle */
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.spacing.lg,
  },

  toggleText: {
    ...theme.textVariants.caption,
    color: theme.colors.mutedForeground,
  },

  toggleAction: {
    ...theme.textVariants.labelSmall,
    color: theme.colors.primary,
  },

  /* Not now */
  notNowLink: {
    marginTop: 24,
    minHeight: 44,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    alignSelf: 'center',
    justifyContent: 'center',
  },

  notNowText: {
    ...theme.textVariants.labelSmall,
    color: theme.colors.mutedForeground,
  },
}))
