import { I18n } from 'i18n-js'

import { DEFAULT_LOCALE, translations } from '@/localization/translations'

export const i18n = new I18n(translations)

i18n.defaultLocale = DEFAULT_LOCALE
i18n.enableFallback = true

