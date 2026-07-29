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
import { useTranslation } from '@/localization'
import { createThemedStyles } from '@/styles/createStyles'
import { layout } from '@/styles/layout'
import { theme } from '@/styles/theme'

const KEYBOARD_SCROLL_PADDING = 96

export default function UpdatePasswordScreen() {
  const { t } = useTranslation()
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
      setError(t('auth.updatePassword.invalidLink'))
      return
    }

    if (!password || !confirmPassword) {
      setError(t('auth.updatePassword.missingFields'))
      return
    }

    if (passwordPolicyIssues.length > 0) {
      setError(t('auth.updatePassword.weakPassword'))
      return
    }

    if (password !== confirmPassword) {
      setError(t('auth.updatePassword.mismatch'))
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
      setError(getUserFacingErrorMessage(submitError, t('auth.updatePassword.genericError')))
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
            <Text style={styles.backText}>{t('auth.shared.actions.back')}</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.iconWrapper}>
              <Feather name="lock" size={24} style={styles.icon} />
            </View>

            <Text style={styles.title}>{t('auth.updatePassword.title')}</Text>
            <Text style={styles.subtitle}>{t('auth.updatePassword.subtitle')}</Text>
          </View>

          {saved ? (
            <View style={styles.noticeCard}>
              <Text style={styles.successText}>{t('auth.updatePassword.success')}</Text>

              <Button
                variant="secondary"
                onPress={() => router.replace('/(public)/login')}
                style={styles.secondaryButton}
              >
                {t('auth.shared.actions.goToSignIn')}
              </Button>
            </View>
          ) : !isLoading && !session ? (
            <View style={styles.noticeCard}>
              <Text style={styles.noticeTitle}>{t('auth.updatePassword.noSessionTitle')}</Text>
              <Text style={styles.noticeText}>{t('auth.updatePassword.noSessionMessage')}</Text>

              <Button onPress={() => router.replace('/(public)/forgot-password')} style={styles.submitButton}>
                {t('auth.updatePassword.requestNewLink')}
              </Button>
            </View>
          ) : (
            <>
              <View style={styles.field}>
                <Text style={styles.label}>{t('auth.updatePassword.newPasswordLabel')}</Text>
                <View style={styles.inputWrapper}>
                  <Feather name="lock" size={18} style={styles.inputIcon} />
                  <TextInput
                    placeholder={t('auth.updatePassword.newPasswordPlaceholder')}
                    placeholderTextColor={theme.colors.warmGray}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.input}
                    value={password}
                    onChangeText={handlePasswordChange}
                  />
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? t('auth.shared.actions.hidePassword') : t('auth.shared.actions.showPassword')}
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
                          {requirementLabel}
                        </Text>
                      </View>
                    )
                  })}
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>{t('auth.updatePassword.confirmPasswordLabel')}</Text>
                <View style={styles.inputWrapper}>
                  <Feather name="check-circle" size={18} style={styles.inputIcon} />
                  <TextInput
                    placeholder={t('auth.updatePassword.confirmPasswordPlaceholder')}
                    placeholderTextColor={theme.colors.warmGray}
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
                      showConfirmPassword ? t('auth.updatePassword.hideConfirm') : t('auth.updatePassword.showConfirm')
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
              <Button
                onPress={() => {
                  void handleSubmit()
                }}
                loading={submitting}
                disabled={!canSubmit}
                style={styles.submitButton}
              >
                {t('auth.updatePassword.update')}
              </Button>

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
  noticeCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.xl,
    padding: layout.cardPadding,
    gap: layout.cardGap,
  },
  noticeTitle: {
    ...theme.textVariants.heading,
    color: theme.colors.foreground,
  },
  noticeText: {
    ...theme.textVariants.body,
    color: theme.colors.mutedForeground,
  },
  field: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
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
