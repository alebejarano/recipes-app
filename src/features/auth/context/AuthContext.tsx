// features/auth/context/AuthContext.tsx

import { supabase } from '@/lib/supabase'
import type { AuthResponse, Session, User, UserAttributes } from '@supabase/supabase-js'
import * as Linking from 'expo-linking'
import { router } from 'expo-router'
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { usePostHog } from 'posthog-react-native'
import { tagLocalDataAsMigratable } from '@/features/storage/localAccountLinking'
import { isValidEmail, normalizeEmail } from '@/features/auth/utils/email'
import {
  getPasswordRecoveryRedirectUrl,
  getPasswordRecoverySessionFromUrl,
} from '@/features/auth/utils/passwordRecovery'

type AuthContextValue = {
  session: Session | null
  user: User | null
  isLoading: boolean

  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<AuthResponse['data']>
  updateProfileName: (name: string) => Promise<void>
  updateEmailPreferences: (preferences: EmailPreferences) => Promise<void>
  updateEmailAddress: (email: string) => Promise<{ pendingEmail: string | null }>
  sendPasswordResetEmail: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
  updatePasswordWithCurrentPassword: (currentPassword: string, nextPassword: string) => Promise<void>
  deleteAccount: () => Promise<void>
  logout: () => Promise<void>
}

export type EmailPreferences = {
  weeklyDigest: boolean
  cookingTips: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const posthog = usePostHog()
  const lastIdentifiedUserId = useRef<string | null>(null)

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

  const handleIncomingAuthUrl = useCallback(async (url: string | null) => {
    if (!url) return

    const recoverySession = getPasswordRecoverySessionFromUrl(url)
    if (!recoverySession) return

    const { error } = await supabase.auth.setSession({
      access_token: recoverySession.accessToken,
      refresh_token: recoverySession.refreshToken,
    })

    if (error) {
      throw error
    }

    router.replace('/(public)/update-password')
  }, [])

  useEffect(() => {
    void Linking.getInitialURL()
      .then((url) => handleIncomingAuthUrl(url))
      .catch(() => {
        // Ignore invalid boot URLs and continue app startup.
      })

    const subscription = Linking.addEventListener('url', ({ url }) => {
      void handleIncomingAuthUrl(url).catch(() => {
        // Ignore malformed or expired auth links and leave UI to surface next steps.
      })
    })

    return () => {
      subscription.remove()
    }
  }, [handleIncomingAuthUrl])

  useEffect(() => {
    if (!posthog) return

    const userId = session?.user?.id ?? null

    if (!userId) {
      if (lastIdentifiedUserId.current) {
        posthog.reset()
        lastIdentifiedUserId.current = null
      }
      return
    }

    if (lastIdentifiedUserId.current !== userId) {
      const identifyProps: { email?: string } = {}
      if (session?.user?.email) {
        identifyProps.email = session.user.email
      }
      posthog.identify(userId, {
        ...identifyProps,
      })
      lastIdentifiedUserId.current = userId
    }
  }, [posthog, session?.user?.id, session?.user?.email])

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

    const { data, error } = await supabase.auth.signUp({ email: normalized, password })
    if (error) throw error
    return data
  }

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

  const updateEmailPreferences = useCallback(async (preferences: EmailPreferences) => {
    const { data, error } = await supabase.auth.updateUser({
      data: {
        email_updates: preferences,
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

    const { data, error } = await supabase.auth.updateUser({
      email: normalized,
    })

    const pendingEmail = normalizeEmail(data.user?.new_email ?? '')
    const isRequestedEmailPending = pendingEmail === normalized
    if (error) throw error

    if (data.user) {
      setSession((prev) => (prev ? { ...prev, user: data.user } : prev))
    }

    return {
      pendingEmail: isRequestedEmailPending ? normalized : null,
    }
  }, [])

  const sendPasswordResetEmail = useCallback(async (email: string) => {
    const normalized = normalizeEmail(email)
    if (!normalized) throw new Error('Email is required')
    if (!isValidEmail(normalized)) throw new Error('Please enter a valid email address.')

    const { error } = await supabase.auth.resetPasswordForEmail(normalized, {
      redirectTo: getPasswordRecoveryRedirectUrl(),
    })

    if (error) throw error
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
      updateProfileName,
      updateEmailPreferences,
      updateEmailAddress,
      sendPasswordResetEmail,
      updatePassword,
      updatePasswordWithCurrentPassword,
      deleteAccount,
      logout,
    }),
    [
      session,
      isLoading,
      updateEmailPreferences,
      updateEmailAddress,
      sendPasswordResetEmail,
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
