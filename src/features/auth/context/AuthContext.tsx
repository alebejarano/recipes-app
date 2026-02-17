// features/auth/context/AuthContext.tsx

import { supabase } from '@/lib/supabase'
import type { AuthResponse, Session, User } from '@supabase/supabase-js'
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { usePostHog } from 'posthog-react-native'
import { tagLocalDataAsMigratable } from '@/features/storage/localAccountLinking'
import { isValidEmail, normalizeEmail } from '@/features/auth/utils/email'

type AuthContextValue = {
  session: Session | null
  user: User | null
  isLoading: boolean

  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<AuthResponse['data']>
  updateProfileName: (name: string) => Promise<void>
  updateEmailAddress: (email: string) => Promise<{ pendingEmail: string | null }>
  deleteAccount: () => Promise<void>
  logout: () => Promise<void>
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
      updateEmailAddress,
      deleteAccount,
      logout,
    }),
    [session, isLoading, updateEmailAddress, deleteAccount]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
