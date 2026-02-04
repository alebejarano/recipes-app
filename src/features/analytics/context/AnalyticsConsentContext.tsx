import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type AnalyticsConsentState = {
  analyticsEnabled: boolean;
  sessionReplayEnabled: boolean;
};

type AnalyticsConsentContextValue = AnalyticsConsentState & {
  isLoaded: boolean;
  setAnalyticsEnabled: (next: boolean) => void;
  setSessionReplayEnabled: (next: boolean) => void;
};

const STORAGE_KEY = 'analytics_consent_v1';

const DEFAULT_CONSENT: AnalyticsConsentState = {
  analyticsEnabled: true,
  sessionReplayEnabled: true,
};

const AnalyticsConsentContext = createContext<AnalyticsConsentContextValue | null>(null);

export function AnalyticsConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useState<AnalyticsConsentState>(DEFAULT_CONSENT);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!isMounted) return;
        if (!raw) {
          setIsLoaded(true);
          return;
        }
        const parsed = JSON.parse(raw) as Partial<AnalyticsConsentState>;
        setConsent((prev) => ({
          analyticsEnabled: typeof parsed.analyticsEnabled === 'boolean' ? parsed.analyticsEnabled : prev.analyticsEnabled,
          sessionReplayEnabled: typeof parsed.sessionReplayEnabled === 'boolean' ? parsed.sessionReplayEnabled : prev.sessionReplayEnabled,
        }));
        setIsLoaded(true);
      })
      .catch(() => {
        if (!isMounted) return;
        setIsLoaded(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const persist = useCallback((next: AnalyticsConsentState) => {
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const setAnalyticsEnabled = useCallback(
    (next: boolean) => {
      setConsent((prev) => {
        const updated = { ...prev, analyticsEnabled: next };
        persist(updated);
        return updated;
      });
    },
    [persist]
  );

  const setSessionReplayEnabled = useCallback(
    (next: boolean) => {
      setConsent((prev) => {
        const updated = { ...prev, sessionReplayEnabled: next };
        persist(updated);
        return updated;
      });
    },
    [persist]
  );

  const value = useMemo(
    () => ({
      ...consent,
      isLoaded,
      setAnalyticsEnabled,
      setSessionReplayEnabled,
    }),
    [consent, isLoaded, setAnalyticsEnabled, setSessionReplayEnabled]
  );

  return <AnalyticsConsentContext.Provider value={value}>{children}</AnalyticsConsentContext.Provider>;
}

export function useAnalyticsConsent() {
  const ctx = useContext(AnalyticsConsentContext);
  if (!ctx) throw new Error('useAnalyticsConsent must be used within AnalyticsConsentProvider');
  return ctx;
}
