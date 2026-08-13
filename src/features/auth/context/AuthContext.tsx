// features/auth/context/AuthContext.tsx

import { supabase } from '@/lib/supabase'
import type { AuthResponse, Session, User, UserAttributes } from '@supabase/supabase-js'
import * as Linking from 'expo-linking'
import { router } from 'expo-router'
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Alert } from 'react-native'
import { tagLocalDataAsMigratable } from '@/features/storage/localAccountLinking'
import { isValidEmail, normalizeEmail } from '@/features/auth/utils/email'
import {
  getAuthLinkSessionFromUrl,
  getAuthLinkParamsFromUrl,
} from '@/features/auth/utils/passwordRecovery'
import { useTranslation } from '@/localization'

type AuthContextValue = {
  session: Session | null
  user: User | null
  isLoading: boolean

  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<AuthResponse['data']>
  resendEmailConfirmation: (email: string) => Promise<void>
  verifySignupCode: (email: string, code: string) => Promise<void>
  resendEmailChangeConfirmation: (email: string) => Promise<void>
  verifyEmailChangeCode: (email: string, code: string) => Promise<{ completed: boolean }>
  updateProfileName: (name: string) => Promise<void>
  updatePushPreferences: (preferences: PushPreferences) => Promise<void>
  updateEmailAddress: (email: string) => Promise<{ pendingEmail: string | null }>
  sendPasswordResetEmail: (email: string) => Promise<void>
  verifyPasswordResetCode: (email: string, code: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
  updatePasswordWithCurrentPassword: (currentPassword: string, nextPassword: string) => Promise<void>
  deleteAccount: () => Promise<void>
  logout: () => Promise<void>
}

export type PushPreferences = {
  recipeReminders: boolean
  activityAlerts: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const pendingEmailRef = useRef<string | null>(null)
  const handledAuthUrlsRef = useRef(new Set<string>())
  const { t } = useTranslation()

  useEffect(() => {
    let isMounted = true

    // Restore existing session (persisted via SecureStore in supabase client config)
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!isMounted) return

        if (error) {
          setSession(null)
        } else {
          setSession(data.session ?? null)
        }

        setIsLoading(false)
      })
      .catch(() => {
        if (!isMounted) return
        setSession(null)
        setIsLoading(false)
      })

    // Listen for auth changes (sign-in, sign-out, token refresh)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => {
      isMounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const pendingEmail = normalizeEmail(session?.user?.new_email ?? '')
    if (pendingEmail) {
      pendingEmailRef.current = pendingEmail
      return
    }

    const updatedEmail = normalizeEmail(session?.user?.email ?? '')
    if (pendingEmailRef.current && updatedEmail === pendingEmailRef.current) {
      pendingEmailRef.current = null
      Alert.alert(t('profile.editProfile.emailUpdatedTitle'), t('profile.editProfile.emailUpdatedMessage'))
    }
  }, [session?.user?.email, session?.user?.new_email, t])

  const handleIncomingAuthUrl = useCallback(async (url: string | null) => {
    if (!url) return
    if (handledAuthUrlsRef.current.has(url)) return
    handledAuthUrlsRef.current.add(url)

    const authLinkParams = getAuthLinkParamsFromUrl(url)
    const pendingEmailBeforeConfirmation = normalizeEmail(session?.user?.new_email ?? '')
    const isPasswordRecovery =
      authLinkParams.type === 'recovery' || authLinkParams.path === 'update-password'
    const hasAuthLinkError = Boolean(
      authLinkParams.error || authLinkParams.errorCode || authLinkParams.errorDescription
    )

    const showAuthLinkError = () => {
      Alert.alert(
        t('auth.errors.authLinkExpiredTitle'),
        isPasswordRecovery
          ? t('auth.updatePassword.invalidLink')
          : t('auth.errors.confirmationLinkInvalid')
      )
    }

    const syncConfirmedEmailChange = async () => {
      let pendingEmail = pendingEmailBeforeConfirmation
      let latestSession = session

      if (!pendingEmail) {
        const { data } = await supabase.auth.getSession()
        latestSession = data.session
        pendingEmail = normalizeEmail(data.session?.user?.new_email ?? '')
      }

      if (!pendingEmail) return false

      const { data, error } = await supabase.auth.getUser()
      if (error || !data.user) return false

      setSession((current) =>
        current ? { ...current, user: data.user } : latestSession ? { ...latestSession, user: data.user } : current
      )
      if (normalizeEmail(data.user.email ?? '') === pendingEmail) {
        pendingEmailRef.current = null
        Alert.alert(t('profile.editProfile.emailUpdatedTitle'), t('profile.editProfile.emailUpdatedMessage'))
        return true
      }

      return false
    }

    const handleFailedEmailChangeConfirmation = async () => {
      if (!isPasswordRecovery && await syncConfirmedEmailChange()) {
        router.replace('/(auth)/(tabs)')
        return
      }

      showAuthLinkError()
    }

    if (hasAuthLinkError) {
      await handleFailedEmailChangeConfirmation()
      return
    }

    if (authLinkParams.code) {
      const { error } = await supabase.auth.exchangeCodeForSession(authLinkParams.code)
      if (error) {
        await handleFailedEmailChangeConfirmation()
        return
      }

      await syncConfirmedEmailChange()
      router.replace(isPasswordRecovery ? '/(public)/update-password' : '/(auth)/(tabs)')
      return
    }

    const authSession = getAuthLinkSessionFromUrl(url)
    if (!authSession) return

    const { error } = await supabase.auth.setSession({
      access_token: authSession.accessToken,
      refresh_token: authSession.refreshToken,
    })

    if (error) {
      await handleFailedEmailChangeConfirmation()
      return
    }

    await syncConfirmedEmailChange()
    router.replace(isPasswordRecovery ? '/(public)/update-password' : '/(auth)/(tabs)')
  }, [session, t])

  useEffect(() => {
    void Linking.getInitialURL()
      .then((url) => handleIncomingAuthUrl(url))
      .catch(() => {
        // Ignore malformed boot URLs and continue app startup.
      })

    const subscription = Linking.addEventListener('url', ({ url }) => {
      void handleIncomingAuthUrl(url).catch(() => {
        // Ignore malformed auth links and leave the active session unchanged.
      })
    })

    return () => {
      subscription.remove()
    }
  }, [handleIncomingAuthUrl])

  useEffect(() => {
    const userId = session?.user?.id
    if (!userId) return

    tagLocalDataAsMigratable(userId).catch(() => {
      // Keep auth resilient; tagging is best-effort metadata enrichment.
    })
  }, [session?.user?.id])

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  /**
   * Returns Supabase's auth response data so the UI can decide what to do next:
   * - If email confirmations are enabled, data.session may be null -> show "Check your email"
   * - If data.session exists, user is signed in -> redirect to app
   */
  const register = async (email: string, password: string) => {
    const normalized = normalizeEmail(email)
    if (!normalized) throw new Error('Email is required')
    if (!isValidEmail(normalized)) throw new Error('Please enter a valid email address.')

    const { data, error } = await supabase.auth.signUp({
      email: normalized,
      password,
    })
    if (error) throw error
    return data
  }

  const resendEmailConfirmation = useCallback(async (email: string) => {
    const normalized = normalizeEmail(email)
    if (!normalized) throw new Error('Email is required')
    if (!isValidEmail(normalized)) throw new Error('Please enter a valid email address.')

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: normalized,
    })
    if (error) throw error
  }, [])

  const verifySignupCode = useCallback(async (email: string, code: string) => {
    const normalizedEmail = normalizeEmail(email)
    const normalizedCode = code.trim()
    if (!normalizedEmail) throw new Error('Email is required')
    if (!normalizedCode) throw new Error('Verification code is required')

    const { data, error } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token: normalizedCode,
      type: 'signup',
    })
    if (error) throw error
    if (!data.session) throw new Error('Unable to verify the confirmation code.')

    setSession(data.session)
  }, [])

  const resendEmailChangeConfirmation = useCallback(async (email: string) => {
    const normalized = normalizeEmail(email)
    if (!normalized) throw new Error('Email is required')
    if (!isValidEmail(normalized)) throw new Error('Please enter a valid email address.')

    const { error } = await supabase.auth.resend({
      type: 'email_change',
      email: normalized,
    })
    if (error) throw error
  }, [])

  const verifyEmailChangeCode = useCallback(async (email: string, code: string) => {
    const normalizedEmail = normalizeEmail(email)
    const normalizedCode = code.trim()
    const pendingEmail = normalizeEmail(session?.user?.new_email ?? '')
    if (!normalizedEmail) throw new Error('Email is required')
    if (!normalizedCode) throw new Error('Verification code is required')
    if (!pendingEmail) throw new Error('There is no email change to confirm.')

    const { data, error } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token: normalizedCode,
      type: 'email_change',
    })
    if (error) throw error

    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) throw userError ?? new Error('Unable to refresh your profile.')

    setSession((current) =>
      current ? { ...current, user: userData.user } : data.session ? { ...data.session, user: userData.user } : current
    )

    return {
      completed: normalizeEmail(userData.user.email ?? '') === pendingEmail,
    }
  }, [session?.user?.new_email])

  const updateProfileName = async (name: string) => {
    const trimmed = name.trim()
    if (!trimmed) throw new Error('Name is required')

    const { data, error } = await supabase.auth.updateUser({
      data: { display_name: trimmed },
    })
    if (error) throw error

    if (data.user) {
      setSession((prev) => (prev ? { ...prev, user: data.user } : prev))
    }
  }

  const updatePushPreferences = useCallback(async (preferences: PushPreferences) => {
    const { data, error } = await supabase.auth.updateUser({
      data: {
        push_notifications: preferences,
      },
    })
    if (error) throw error

    if (data.user) {
      setSession((prev) => (prev ? { ...prev, user: data.user } : prev))
    }
  }, [])

  const updateEmailAddress = useCallback(async (email: string) => {
    const normalized = normalizeEmail(email)
    if (!normalized) throw new Error('Email is required')
    if (!isValidEmail(normalized)) throw new Error('Please enter a valid email address.')

    const { data, error } = await supabase.auth.updateUser({ email: normalized })

    if (error) throw error

    const { data: currentUserData } = await supabase.auth.getUser()
    const currentUser = currentUserData.user ?? data.user
    const pendingEmail = normalizeEmail(currentUser?.new_email ?? '')
    const isRequestedEmailPending = pendingEmail === normalized

    if (currentUser) {
      setSession((prev) => (prev ? { ...prev, user: currentUser } : prev))
    }

    return {
      pendingEmail: isRequestedEmailPending ? normalized : null,
    }
  }, [])

  const sendPasswordResetEmail = useCallback(async (email: string) => {
    const normalized = normalizeEmail(email)
    if (!normalized) throw new Error('Email is required')
    if (!isValidEmail(normalized)) throw new Error('Please enter a valid email address.')

    const { error } = await supabase.auth.resetPasswordForEmail(normalized)

    if (error) throw error
  }, [])

  const verifyPasswordResetCode = useCallback(async (email: string, code: string) => {
    const normalizedEmail = normalizeEmail(email)
    const normalizedCode = code.trim()
    if (!normalizedEmail) throw new Error('Email is required')
    if (!normalizedCode) throw new Error('Verification code is required')

    const { data, error } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token: normalizedCode,
      type: 'recovery',
    })
    if (error) throw error
    if (!data.session) throw new Error('Unable to verify the reset code.')

    setSession(data.session)
  }, [])

  const updatePassword = useCallback(async (password: string) => {
    const trimmed = password.trim()
    if (!trimmed) throw new Error('Password is required')

    const { error } = await supabase.auth.updateUser({
      password: trimmed,
    })

    if (error) throw error

    setSession(null)
    await supabase.auth.signOut({ scope: 'local' })
  }, [])

  const updatePasswordWithCurrentPassword = useCallback(
    async (currentPassword: string, nextPassword: string) => {
      const email = normalizeEmail(session?.user?.email ?? '')
      const current = currentPassword.trim()
      const next = nextPassword.trim()

      if (!email) throw new Error('No email address found for this account.')
      if (!current) throw new Error('Current password is required.')
      if (!next) throw new Error('New password is required.')

      const { data, error: updateError } = await supabase.auth.updateUser({
        password: next,
        current_password: current,
      } as UserAttributes & { current_password: string })
      if (updateError) throw updateError

      if (data.user) {
        setSession((prev) => (prev ? { ...prev, user: data.user } : prev))
      }
    },
    [session?.user?.email]
  )

  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const deleteAccount = useCallback(async () => {
    // Refresh first so invoke() sends a fresh access token.
    const { data: refreshedData, error: refreshError } = await supabase.auth.refreshSession()
    if (refreshError) throw refreshError

    const accessToken =
      refreshedData.session?.access_token ??
      (await supabase.auth.getSession()).data.session?.access_token ??
      null
    if (!accessToken) {
      throw new Error('Your session has expired. Please log in again.')
    }

    const { data, error } = await supabase.functions.invoke('delete-account', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    if (error) {
      const context = (error as { context?: { status?: number; text?: () => Promise<string> } }).context
      let details = ''
      if (context?.text) {
        try {
          const raw = await context.text()
          if (raw) {
            try {
              const parsed = JSON.parse(raw) as { error?: string; message?: string }
              details = parsed.error ?? parsed.message ?? raw
            } catch {
              details = raw
            }
          }
        } catch {
          // Ignore response parsing errors and fall back to generic message.
        }
      }
      const statusLabel = typeof context?.status === 'number' ? ` (${context.status})` : ''
      const message = details || error.message
      throw new Error(`Delete account failed${statusLabel}: ${message}`)
    }
    if (!data || (typeof data === 'object' && data !== null && 'success' in data && !(data as any).success)) {
      throw new Error('Delete account request failed.')
    }

    setSession(null)
    await supabase.auth.signOut({ scope: 'local' })
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isLoading,
      login,
      register,
      resendEmailConfirmation,
      verifySignupCode,
      resendEmailChangeConfirmation,
      verifyEmailChangeCode,
      updateProfileName,
      updatePushPreferences,
      updateEmailAddress,
      sendPasswordResetEmail,
      verifyPasswordResetCode,
      updatePassword,
      updatePasswordWithCurrentPassword,
      deleteAccount,
      logout,
    }),
    [
      session,
      isLoading,
      resendEmailConfirmation,
      verifySignupCode,
      resendEmailChangeConfirmation,
      verifyEmailChangeCode,
      updatePushPreferences,
      updateEmailAddress,
      sendPasswordResetEmail,
      verifyPasswordResetCode,
      updatePassword,
      updatePasswordWithCurrentPassword,
      deleteAccount,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
