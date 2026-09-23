import 'expo-sqlite/localStorage/install'

import { useColorScheme } from 'react-native'
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { refreshThemedStyles } from '@/styles/createStyles'
import { darkTheme, lightTheme, setActiveTheme, theme, type Theme } from '@/styles/theme'

export type ThemePreference = 'system' | 'light' | 'dark'

type ThemeContextValue = {
  preference: ThemePreference
  mode: 'light' | 'dark'
  theme: Theme
  setPreference: (preference: ThemePreference) => void
}

const THEME_PREFERENCE_STORAGE_KEY = 'appearance.themePreference'
const ThemeContext = createContext<ThemeContextValue | null>(null)

function getStoredPreference(): ThemePreference {
  try {
    const storedValue = localStorage.getItem(THEME_PREFERENCE_STORAGE_KEY)
    return storedValue === 'light' || storedValue === 'dark' || storedValue === 'system'
      ? storedValue
      : 'system'
  } catch {
    return 'system'
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme()
  const [preference, setPreferenceState] = useState<ThemePreference>(getStoredPreference)
  const deviceMode = systemColorScheme === 'dark' ? 'dark' : 'light'
  const mode: 'light' | 'dark' = preference === 'system' ? deviceMode : preference
  const activeTheme = mode === 'dark' ? darkTheme : lightTheme

  // Existing screens create their styles at module scope. Refresh those style
  // objects before descendants render, then remount the navigation tree so the
  // native views receive the new style values immediately.
  setActiveTheme(activeTheme)
  refreshThemedStyles(activeTheme)

  useEffect(() => {
    try {
      localStorage.setItem(THEME_PREFERENCE_STORAGE_KEY, preference)
    } catch {
      // Appearance still works for this session if storage is unavailable.
    }
  }, [preference])

  const setPreference = useCallback((nextPreference: ThemePreference) => {
    setPreferenceState(nextPreference)
  }, [])

  const value = useMemo(
    () => ({ preference, mode, theme, setPreference }),
    [mode, preference, setPreference]
  )

  return (
    <ThemeContext.Provider value={value}>
      <React.Fragment key={mode}>{children}</React.Fragment>
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }

  return context
}
