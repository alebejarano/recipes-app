import { Feather } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
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
import OAuthButtons from '@/features/auth/components/OAuthButtons'
import { useAuth } from '@/features/auth/context/AuthContext'
import { isValidEmail, normalizeEmail } from '@/features/auth/utils/email'
import { createThemedStyles } from '@/styles/createStyles'

export type AuthMode = 'login' | 'register'

type AuthScreenProps = {
  initialMode: AuthMode
}

type SubmitError = {
  title: string
  message: string
} | null

export default function AuthScreen({ initialMode }: AuthScreenProps) {
  const router = useRouter()
  const { login, register } = useAuth()

  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [error, setError] = useState<SubmitError>(null)
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false)

  const isLogin = mode === 'login'

  const canSubmit = useMemo(() => {
    const normalizedEmail = normalizeEmail(email)
    if (!normalizedEmail) return false
    if (!isLogin && !isValidEmail(normalizedEmail)) return false
    if (!password) return false
    if (!isLogin) {
      if (!confirmPassword) return false
      if (password !== confirmPassword) return false
    }
    return true
  }, [email, password, confirmPassword, isLogin])

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

    if (!isLogin && password !== confirmPassword) {
      setError({ title: 'Passwords do not match', message: 'Please re-enter matching passwords.' })
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
    } catch (e: any) {
      // Supabase errors usually have a message; keep it user-friendly
      const message =
        typeof e?.message === 'string'
          ? e.message
          : 'Something went wrong. Please try again.'

      setError({
        title: isLogin ? 'Sign in failed' : 'Registration failed',
        message,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = () => {
    router.push('/(public)/forgot-password')
  }

  const handleAppleAuth = () => {
    // TODO
    console.log('Apple auth')
  }

  const handleGoogleAuth = () => {
    // TODO
    console.log('Google auth')
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
        <View style={[styles.content, styles.confirmWrap]}>
          <View style={styles.header}>
            <View style={styles.iconWrapper}>
              <Text style={styles.emoji}>✉️</Text>
            </View>

            <Text style={styles.title}>Check your email</Text>

            <Text style={styles.subtitle}>
              We sent a confirmation link to <Text style={styles.inlineStrong}>{email.trim()}</Text>.
              Open it to finish creating your account, then come back and sign in.
            </Text>
          </View>

          <Button
            onPress={() => {
              setNeedsEmailConfirmation(false)
              setMode('login')
            }}
            size="lg"
            style={styles.submitButton}
            textStyle={styles.submitButtonText}
          >
            Go to sign in
          </Button>

          <TouchableOpacity onPress={goBackToGetStarted} style={styles.notNowLink}>
            <Text style={styles.notNowText}>Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconWrapper}>
              <Text style={styles.emoji}>🍳</Text>
            </View>

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
            <View style={styles.inputWrapper}>
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
              >
                <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} style={styles.eyeIcon} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password (register only) */}
          {!isLogin && (
            <View style={styles.field}>
              <Text style={styles.label}>Confirm Password</Text>

              <View style={styles.inputWrapper}>
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
            </View>
          )}

          {/* Forgot password — login only */}
          {isLogin && (
            <TouchableOpacity style={styles.forgotRow} onPress={handleForgotPassword} disabled={loading}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          )}

          {/* Submit button */}
          <Button
            onPress={handleSubmit}
            disabled={loading || !canSubmit}
            size="lg"
            style={[styles.submitButton, (!canSubmit || loading) && styles.submitButtonDisabled]}
            textStyle={styles.submitButtonText}
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

          {/* OAuth block */}
          <OAuthButtons onApplePress={handleAppleAuth} onGooglePress={handleGoogleAuth} />

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
    paddingHorizontal: theme.spacing.lg,
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
    padding: theme.spacing.md,
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

  /* Button */
  submitButton: {
    width: '100%',
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
    marginTop: theme.spacing.md,
  },

  submitButtonDisabled: {
    opacity: 0.7,
  },

  submitButtonText: {
    color: theme.colors.primaryForeground,
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.base,
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
    alignSelf: 'center',
  },

  notNowText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
}))
