import AsyncStorage from '@react-native-async-storage/async-storage'
import { useLocales } from 'expo-localization'
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { i18n } from '@/localization/i18n'
import {
  DEFAULT_LOCALE,
  type LanguagePreference,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from '@/localization/translations'

type TranslationParams = Record<string, string | number | boolean | null | undefined>
const LANGUAGE_PREFERENCE_STORAGE_KEY = 'localization.languagePreference'

type LocalizationContextValue = {
  locale: SupportedLocale
  deviceLocale: string
  languagePreference: LanguagePreference
  setLanguagePreference: (preference: LanguagePreference) => void
  t: (scope: string, params?: TranslationParams) => string
}

const LocalizationContext = createContext<LocalizationContextValue | null>(null)

function resolveSupportedLocale(locale?: string | null): SupportedLocale {
  if (!locale) {
    return DEFAULT_LOCALE
  }

  const normalizedLocale = locale.toLowerCase()
  const exactMatch = SUPPORTED_LOCALES.find((supportedLocale) => supportedLocale === normalizedLocale)

  if (exactMatch) {
    return exactMatch
  }

  const languageCode = normalizedLocale.split('-')[0]
  const languageMatch = SUPPORTED_LOCALES.find((supportedLocale) => supportedLocale === languageCode)

  return languageMatch ?? DEFAULT_LOCALE
}

export function LocalizationProvider({ children }: { children: React.ReactNode }) {
  const locales = useLocales()
  const [languagePreference, setLanguagePreference] = useState<LanguagePreference>('system')

  const deviceLocale = locales[0]?.languageTag ?? DEFAULT_LOCALE
  const locale =
    languagePreference === 'system' ? resolveSupportedLocale(deviceLocale) : languagePreference

  useEffect(() => {
    i18n.locale = locale
  }, [locale])

  useEffect(() => {
    void AsyncStorage.getItem(LANGUAGE_PREFERENCE_STORAGE_KEY).then((storedValue) => {
      if (storedValue === 'system' || SUPPORTED_LOCALES.includes(storedValue as SupportedLocale)) {
        setLanguagePreference(storedValue as LanguagePreference)
      }
    })
  }, [])

  useEffect(() => {
    void AsyncStorage.setItem(LANGUAGE_PREFERENCE_STORAGE_KEY, languagePreference)
  }, [languagePreference])

  const t = useCallback((scope: string, params?: TranslationParams) => {
    return i18n.t(scope, params)
  }, [])

  const value = useMemo(
    () => ({
      locale,
      deviceLocale,
      languagePreference,
      setLanguagePreference,
      t,
    }),
    [deviceLocale, languagePreference, locale, t]
  )

  return <LocalizationContext.Provider value={value}>{children}</LocalizationContext.Provider>
}

export function useTranslation() {
  const context = useContext(LocalizationContext)

  if (!context) {
    throw new Error('useTranslation must be used within LocalizationProvider')
  }

  return context
}
