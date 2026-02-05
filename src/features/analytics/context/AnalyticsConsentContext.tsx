import AsyncStorage from '@react-native-async-storage/async-storage'
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

type AnalyticsConsentState = {
  analyticsEnabled: boolean
}

type AnalyticsConsentContextValue = AnalyticsConsentState & {
  isLoaded: boolean
  setAnalyticsEnabled: (next: boolean) => void
}

const STORAGE_KEY = 'analytics_consent_v1'

const DEFAULT_CONSENT: AnalyticsConsentState = {
  analyticsEnabled: true,
}

const AnalyticsConsentContext = createContext<AnalyticsConsentContextValue | null>(null)

function safeParse(raw: string): Partial<AnalyticsConsentState> | null {
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') return parsed as Partial<AnalyticsConsentState>
    return null
  } catch {
    return null
  }
}

export function AnalyticsConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useState<AnalyticsConsentState>(DEFAULT_CONSENT)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    let isMounted = true

    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!isMounted) return

        if (!raw) {
          setIsLoaded(true)
          return
        }

        const parsed = safeParse(raw)
        if (!parsed) {
          setIsLoaded(true)
          return
        }

        setConsent((prev) => ({
          analyticsEnabled:
            typeof parsed.analyticsEnabled === 'boolean' ? parsed.analyticsEnabled : prev.analyticsEnabled,
        }))

        setIsLoaded(true)
      })
      .catch(() => {
        if (!isMounted) return
        setIsLoaded(true)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const persist = useCallback((next: AnalyticsConsentState) => {
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }, [])

  const setAnalyticsEnabled = useCallback(
    (next: boolean) => {
      setConsent((prev) => {
        const updated = { ...prev, analyticsEnabled: next }
        persist(updated)
        return updated
      })
    },
    [persist]
  )

  const value = useMemo(
    () => ({
      ...consent,
      isLoaded,
      setAnalyticsEnabled,
    }),
    [consent, isLoaded, setAnalyticsEnabled]
  )

  return <AnalyticsConsentContext.Provider value={value}>{children}</AnalyticsConsentContext.Provider>
}

export function useAnalyticsConsent() {
  const ctx = useContext(AnalyticsConsentContext)
  if (!ctx) throw new Error('useAnalyticsConsent must be used within AnalyticsConsentProvider')
  return ctx
}
