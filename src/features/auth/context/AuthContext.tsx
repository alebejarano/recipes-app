// features/auth/context/AuthContext.tsx

import { supabase } from '@/lib/supabase'
import type { AuthResponse, Session, User } from '@supabase/supabase-js'
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { usePostHog } from 'posthog-react-native'

type AuthContextValue = {
  session: Session | null
  user: User | null
  isLoading: boolean

  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<AuthResponse['data']>
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
      posthog.identify(userId, {
        email: session?.user?.email ?? undefined,
      })
      lastIdentifiedUserId.current = userId
    }
  }, [posthog, session?.user?.id, session?.user?.email])

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
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    return data
  }

  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isLoading,
      login,
      register,
      logout,
    }),
    [session, isLoading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
