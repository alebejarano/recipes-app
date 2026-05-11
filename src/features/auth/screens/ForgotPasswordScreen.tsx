import { Feather } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
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
import { isValidEmail, normalizeEmail } from '@/features/auth/utils/email'
import { getUserFacingErrorMessage } from '@/lib/userFacingError'
import { createThemedStyles } from '@/styles/createStyles'
import { layout } from '@/styles/layout'

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function getResetErrorMessage(error: any) {
  const message = typeof error?.message === 'string' ? error.message : ''
  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes('rate') || lowerMessage.includes('security purposes')) {
    return 'For security, reset links can only be requested every few moments. Please wait and try again.'
  }

  if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
    return 'Check your connection and try sending the reset link again.'
  }

  return getUserFacingErrorMessage(error, 'Unable to send the reset link. Please try again.')
}

export default function ForgotPasswordScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ email?: string | string[] }>()
  const initialEmail = normalizeEmail(getParamValue(params.email) ?? '')
  const { sendPasswordResetEmail } = useAuth()
  const [email, setEmail] = useState(initialEmail)
  const [lastSentEmail, setLastSentEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [touched, setTouched] = useState(Boolean(initialEmail))
  const [error, setError] = useState<string | null>(null)

  const normalizedEmail = useMemo(() => normalizeEmail(email), [email])
  const emailError = useMemo(() => {
    if (!touched || !normalizedEmail) return null
    return isValidEmail(normalizedEmail) ? null : 'Please enter a valid email address.'
  }, [normalizedEmail, touched])
  const canSubmit = Boolean(normalizedEmail && isValidEmail(normalizedEmail) && !submitting)

  const handleEmailChange = (value: string) => {
    setEmail(value)
    setTouched(true)
    setError(null)
    setSent(false)
  }

  const handleSubmit = async () => {
    setTouched(true)

    if (!normalizedEmail) {
      setError('Email is required.')
      return
    }

    if (!isValidEmail(normalizedEmail)) {
      setError('Please enter a valid email address.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await sendPasswordResetEmail(normalizedEmail)
      setLastSentEmail(normalizedEmail)
      setSent(true)
    } catch (submitError: any) {
      setError(getResetErrorMessage(submitError))
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
              <Feather name={sent ? 'check-circle' : 'mail'} size={24} style={styles.icon} />
            </View>

            <Text style={styles.title}>{sent ? 'Check your email' : 'Forgot password?'}</Text>
            <Text style={styles.subtitle}>
              {sent
                ? 'Open the reset link on this device to choose a new password.'
                : 'Enter the email you use for your account and we will send you a reset link.'}
            </Text>
          </View>

          {sent ? (
            <View style={styles.successCard}>
              <Text style={styles.successLabel}>Reset link sent</Text>
              <Text style={styles.sentEmail}>{lastSentEmail}</Text>
              <Text style={styles.successText}>
                If an account exists with this email, the reset link should arrive in a few
                minutes. Open it on this device so Dropsauce can finish the password reset.
              </Text>
            </View>
          ) : null}

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>

            <View style={[styles.inputWrapper, (emailError || error) && styles.inputWrapperError]}>
              <Feather name="mail" size={18} style={styles.inputIcon} />
              <TextInput
                placeholder="you@example.com"
                placeholderTextColor="#8c857b"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                style={styles.input}
                value={email}
                onBlur={() => setTouched(true)}
                onChangeText={handleEmailChange}
                editable={!submitting}
              />
            </View>
            {emailError ? <Text style={styles.fieldError}>{emailError}</Text> : null}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Button
            onPress={() => {
              void handleSubmit()
            }}
            disabled={!canSubmit}
            loading={submitting}
            loadingLabel="Sending..."
            size="lg"
            style={styles.submitButton}
          >
            {sent ? 'Resend reset link' : 'Send reset link'}
          </Button>

          <Button
            variant="ghost"
            onPress={() => router.replace('/(public)/login')}
            disabled={submitting}
            style={styles.secondaryButton}
          >
            Back to sign in
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = createThemedStyles(theme => ({
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
  successCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.xl,
    backgroundColor: theme.colors.card,
    padding: layout.cardPadding,
    gap: theme.spacing.xs,
  },
  successLabel: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  sentEmail: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.foreground,
  },
  successText: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
  },
  field: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
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
  fieldError: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.destructive,
    marginTop: theme.spacing.xs,
  },
  submitButton: {
    width: '100%',
    marginTop: theme.spacing.md,
  },
  secondaryButton: {
    marginTop: theme.spacing.sm,
  },
  errorText: {
    marginBottom: theme.spacing.sm,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.destructive,
    textAlign: 'center',
  },
}))
