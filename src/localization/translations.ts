import { en } from '@/localization/translations/en'
import { es } from '@/localization/translations/es'

export const DEFAULT_LOCALE = 'en'

export const SUPPORTED_LOCALES = ['en', 'es'] as const
export const LANGUAGE_PREFERENCES = ['system', ...SUPPORTED_LOCALES] as const

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]
export type LanguagePreference = (typeof LANGUAGE_PREFERENCES)[number]

export const translations = {
    en,
    es,
} as const
