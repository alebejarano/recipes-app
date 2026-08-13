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
import { useLargeScreenLayout } from '@/hooks/useLargeScreenLayout'
import { getUserFacingErrorMessage } from '@/lib/userFacingError'
import { useTranslation } from '@/localization'
import { createThemedStyles } from '@/styles/createStyles'
import { layout } from '@/styles/layout'
import { theme } from '@/styles/theme'

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function getResetErrorMessage(error: any, t: (scope: string) => string) {
  const message = typeof error?.message === 'string' ? error.message : ''
  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes('rate') || lowerMessage.includes('security purposes')) {
    return t('auth.forgotPassword.rateLimit')
  }

  if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
    return t('auth.forgotPassword.networkError')
  }

  return getUserFacingErrorMessage(error, t('auth.forgotPassword.genericError'))
}

export default function ForgotPasswordScreen() {
  const router = useRouter()
  const { t } = useTranslation()
  const largeScreen = useLargeScreenLayout({ maxContentWidth: layout.authContentMaxWidth })
  const params = useLocalSearchParams<{ email?: string | string[] }>()
  const initialEmail = normalizeEmail(getParamValue(params.email) ?? '')
  const { sendPasswordResetEmail, verifyPasswordResetCode } = useAuth()
  const [email, setEmail] = useState(initialEmail)
  const [verificationCode, setVerificationCode] = useState('')
  const [lastSentEmail, setLastSentEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [verifyingCode, setVerifyingCode] = useState(false)
  const [sent, setSent] = useState(false)
  const [touched, setTouched] = useState(Boolean(initialEmail))
  const [error, setError] = useState<string | null>(null)

  const normalizedEmail = useMemo(() => normalizeEmail(email), [email])
  const emailError = useMemo(() => {
    if (!touched || !normalizedEmail) return null
    return isValidEmail(normalizedEmail) ? null : t('auth.forgotPassword.invalidEmail')
  }, [normalizedEmail, t, touched])
  const canSubmit = Boolean(normalizedEmail && isValidEmail(normalizedEmail) && !submitting)
  const canVerifyCode = Boolean(lastSentEmail && verificationCode.length === 6 && !verifyingCode)

  const handleEmailChange = (value: string) => {
    setEmail(value)
    setTouched(true)
    setError(null)
    setSent(false)
    setVerificationCode('')
  }

  const handleVerifyCode = async () => {
    if (!canVerifyCode) return

    setVerifyingCode(true)
    setError(null)

    try {
      await verifyPasswordResetCode(lastSentEmail, verificationCode)
      router.replace('/(public)/update-password')
    } catch (verifyError: any) {
      setError(getResetErrorMessage(verifyError, t))
    } finally {
      setVerifyingCode(false)
    }
  }

  const handleSubmit = async () => {
    setTouched(true)

    if (!normalizedEmail) {
      setError(t('auth.forgotPassword.emailRequired'))
      return
    }

    if (!isValidEmail(normalizedEmail)) {
      setError(t('auth.forgotPassword.invalidEmail'))
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await sendPasswordResetEmail(normalizedEmail)
      setLastSentEmail(normalizedEmail)
      setSent(true)
    } catch (submitError: any) {
      setError(getResetErrorMessage(submitError, t))
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
        <ScrollView
          contentContainerStyle={[styles.content, largeScreen.pagePaddingStyle]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={largeScreen.contentWidthStyle}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backRow}>
            <Feather name="arrow-left" size={18} style={styles.backIcon} />
            <Text style={styles.backText}>{t('auth.shared.actions.back')}</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.iconWrapper}>
              <Feather name={sent ? 'check-circle' : 'mail'} size={24} style={styles.icon} />
            </View>

            <Text style={styles.title}>{sent ? t('auth.forgotPassword.successTitle') : t('auth.forgotPassword.title')}</Text>
            <Text style={styles.subtitle}>
              {sent
                ? t('auth.forgotPassword.successSubtitle')
                : t('auth.forgotPassword.intro')}
            </Text>
          </View>

          {sent ? (
            <View style={styles.successCard}>
              <Text style={styles.successLabel}>{t('auth.forgotPassword.successLabel')}</Text>
              <Text style={styles.sentEmail}>{lastSentEmail}</Text>
              <Text style={styles.successText}>{t('auth.forgotPassword.successMessage')}</Text>

              <View style={styles.codeField}>
                <Text style={styles.label}>{t('auth.forgotPassword.codeLabel')}</Text>
                <View style={[styles.inputWrapper, error && styles.inputWrapperError]}>
                  <Feather name="shield" size={18} style={styles.inputIcon} />
                  <TextInput
                    placeholder={t('auth.forgotPassword.codePlaceholder')}
                    placeholderTextColor={theme.colors.warmGray}
                    keyboardType="number-pad"
                    autoComplete="one-time-code"
                    textContentType="oneTimeCode"
                    maxLength={6}
                    style={styles.input}
                    value={verificationCode}
                    onChangeText={(value) => {
                      setVerificationCode(value.replace(/\D/g, ''))
                      setError(null)
                    }}
                    editable={!verifyingCode}
                  />
                </View>
              </View>

              <Button
                onPress={() => {
                  void handleVerifyCode()
                }}
                disabled={!canVerifyCode}
                loading={verifyingCode}
                loadingLabel={t('auth.forgotPassword.verifyingCode')}
                variant="secondary"
                size="lg"
              >
                {t('auth.forgotPassword.verifyCode')}
              </Button>
            </View>
          ) : null}

          <View style={styles.field}>
            <Text style={styles.label}>{t('auth.shared.emailLabel')}</Text>

            <View style={[styles.inputWrapper, (emailError || error) && styles.inputWrapperError]}>
              <Feather name="mail" size={18} style={styles.inputIcon} />
              <TextInput
                placeholder={t('auth.shared.emailPlaceholder')}
                placeholderTextColor={theme.colors.warmGray}
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
            loadingLabel={t('auth.forgotPassword.sending')}
            size="lg"
            style={styles.submitButton}
          >
            {sent ? t('auth.forgotPassword.resend') : t('auth.forgotPassword.send')}
          </Button>

          <Button
            variant="ghost"
            onPress={() => router.replace('/(public)/login')}
            disabled={submitting}
            style={styles.secondaryButton}
          >
            {t('auth.forgotPassword.backToSignIn')}
          </Button>
          </View>
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
  },
  successCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.xl,
    backgroundColor: theme.colors.card,
    padding: layout.cardPadding,
    gap: theme.spacing.xs,
  },
  codeField: {
    width: '100%',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  successLabel: {
    ...theme.textVariants.labelSmall,
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  sentEmail: {
    ...theme.textVariants.subtitle,
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
    ...theme.textVariants.labelSmall,
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
    ...theme.textVariants.body,
    color: theme.colors.foreground,
  },
  fieldError: {
    ...theme.textVariants.caption,
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
