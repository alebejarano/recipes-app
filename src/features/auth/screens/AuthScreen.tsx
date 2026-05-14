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
import { useAuth } from '@/features/auth/context/AuthContext'
import { isValidEmail, normalizeEmail } from '@/features/auth/utils/email'
import {
  PASSWORD_REQUIREMENTS,
  getPasswordPolicyIssues,
  isPasswordStrong,
} from '@/features/auth/utils/passwordPolicy'
import { getUserFacingErrorMessage } from '@/lib/userFacingError'
import { useLargeScreenLayout } from '@/hooks/useLargeScreenLayout'
import { createThemedStyles } from '@/styles/createStyles'
import { layout } from '@/styles/layout'

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
    return 'Enter a valid email address.'
  }, [email, isLogin])

  const confirmPasswordError = useMemo(() => {
    if (isLogin || !confirmPassword || password === confirmPassword) return null
    return 'Passwords do not match.'
  }, [confirmPassword, isLogin, password])

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
      setError({ title: 'Invalid email', message: 'Please enter a valid email address.' })
      return
    }

    if (!isLogin && !confirmPassword) {
      setError({ title: 'Missing field', message: 'Please confirm your password.' })
      return
    }

    if (!isLogin && passwordPolicyIssues.length > 0) {
      setError({
        title: 'Choose a stronger password',
        message: 'Password should contain at least one character and one number.',
      })
      return
    }

    if (!isLogin && password !== confirmPassword) {
      setError({ title: 'Passwords do not match', message: 'Please re-enter matching passwords.' })
      return
    }

    if (!isLogin && !acceptedLegalTerms) {
      setError({
        title: 'Agreement required',
        message: 'Please agree to the Terms of Service and acknowledge the Privacy Policy before creating an account.',
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

      // If email confirmations are enabled, session may be null.
      if (!data.session) {
        setNeedsEmailConfirmation(true)
        return
      }

      // If we have a session, the user is authenticated.
      router.replace('/(auth)/(tabs)')
    } catch (e) {
      setError({
        title: isLogin ? 'Sign in failed' : 'Registration failed',
        message: getUserFacingErrorMessage(e, 'Something went wrong. Please try again.'),
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

            <Text style={styles.title}>Check your email</Text>

            <Text style={styles.subtitle}>
              We sent a confirmation link to <Text style={styles.inlineStrong}>{email.trim()}</Text>.
              Open it to finish creating your account. If the app does not open automatically, come back and sign in.
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
            Go to sign in
          </Button>

          <TouchableOpacity onPress={goBackToGetStarted} style={styles.notNowLink}>
            <Text style={styles.notNowText}>Back</Text>
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

            <Text style={styles.title}>{isLogin ? 'Welcome back' : 'Create account'}</Text>

            <Text style={styles.subtitle}>
              {isLogin ? 'Sign in to access your recipes' : 'Create an account to upgrade and sync your recipes later'}
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
            <Text style={styles.label}>Email</Text>
            <View style={[styles.inputWrapper, emailError && styles.inputWrapperError]}>
              <Feather name="mail" size={18} style={styles.inputIcon} />
              <TextInput
                placeholder="you@example.com"
                placeholderTextColor="#8c857b"
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
            <Text style={styles.label}>Password</Text>

            <View style={styles.inputWrapper}>
              <Feather name="lock" size={18} style={styles.inputIcon} />

              <TextInput
                placeholder="••••••••"
                placeholderTextColor="#8c857b"
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
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              >
                <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} style={styles.eyeIcon} />
              </TouchableOpacity>
            </View>

            {!isLogin ? (
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
            ) : null}
          </View>

          {/* Confirm Password (register only) */}
          {!isLogin && (
            <View style={styles.field}>
              <Text style={styles.label}>Confirm Password</Text>

              <View style={[styles.inputWrapper, confirmPasswordError && styles.inputWrapperError]}>
                <Feather name="lock" size={18} style={styles.inputIcon} />

                <TextInput
                  placeholder="••••••••"
                  placeholderTextColor="#8c857b"
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
              <Text style={styles.forgotText}>Forgot password?</Text>
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
                I agree to the{' '}
                <Text
                  style={styles.legalConsentLink}
                  onPress={() => router.push('/(public)/terms')}
                >
                  Terms of Service
                </Text>{' '}
                and acknowledge the{' '}
                <Text
                  style={styles.legalConsentLink}
                  onPress={() => router.push('/(public)/privacy-policy')}
                >
                  Privacy Policy
                </Text>
                .
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
            {loading ? '...' : isLogin ? 'Sign in' : 'Create account'}
          </Button>

          {/* Toggle login/register */}
          <View style={styles.toggleRow}>
            <Text style={styles.toggleText}>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
            </Text>

            <TouchableOpacity onPress={toggleMode} disabled={loading}>
              <Text style={styles.toggleAction}>{isLogin ? 'Sign up' : 'Sign in'}</Text>
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
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
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
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.sm,
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
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
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

  fieldError: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.destructive,
    marginTop: theme.spacing.xs,
  },

  /* Forgot */
  forgotRow: {
    alignItems: 'flex-end',
    marginBottom: theme.spacing.md,
  },

  forgotText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.sm,
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
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },

  toggleAction: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.sm,
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
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
}))
