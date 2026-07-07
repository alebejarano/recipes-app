import { Feather } from '@expo/vector-icons'
import React, { useMemo } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

import ProfileSubpageLayout from '@/features/profile/components/ProfileSubpageLayout'
import { useTranslation } from '@/localization'
import {
  LANGUAGE_PREFERENCES,
} from '@/localization/translations'
import { createThemedStyles } from '@/styles/createStyles'

type LanguageSettingsScreenProps = {
  onBack: () => void
}

export default function LanguageSettingsScreen({ onBack }: LanguageSettingsScreenProps) {
  const { deviceLocale, languagePreference, locale, setLanguagePreference, t } = useTranslation()

  const currentDeviceLanguageLabel = useMemo(() => {
    const resolvedDeviceLocale = deviceLocale.toLowerCase().startsWith('es') ? 'es' : 'en'
    return t(`profile.language.labels.${resolvedDeviceLocale}`)
  }, [deviceLocale, t])

  return (
    <ProfileSubpageLayout title={t('profile.language.screenTitle')} onBack={onBack}>
      <Text style={styles.intro}>{t('profile.language.intro')}</Text>

      <View style={styles.card}>
        {LANGUAGE_PREFERENCES.map((preference, index) => {
          const isSelected = languagePreference === preference
          const isCurrentLocale =
            preference === 'system' ? locale === (deviceLocale.toLowerCase().startsWith('es') ? 'es' : 'en') : locale === preference

          return (
            <TouchableOpacity
              key={preference}
              style={[
                styles.optionRow,
                index !== LANGUAGE_PREFERENCES.length - 1 && styles.optionDivider,
              ]}
              onPress={() => setLanguagePreference(preference)}
              activeOpacity={0.8}
            >
              <View style={styles.optionTextWrap}>
                <Text style={styles.optionTitle}>
                  {t(`profile.language.options.${preference}.title`)}
                </Text>
                <Text style={styles.optionSubtitle}>
                  {preference === 'system'
                    ? t('profile.language.options.system.subtitle', {
                        language: currentDeviceLanguageLabel,
                      })
                    : t(`profile.language.options.${preference}.subtitle`)}
                </Text>
              </View>

              <View style={styles.optionMeta}>
                {isCurrentLocale ? (
                  <View style={styles.currentBadge}>
                    <Text style={styles.currentBadgeText}>{t('profile.language.currentBadge')}</Text>
                  </View>
                ) : null}
                {isSelected ? (
                  <Feather name="check" size={18} style={styles.checkIcon} />
                ) : null}
              </View>
            </TouchableOpacity>
          )
        })}
      </View>
    </ProfileSubpageLayout>
  )
}

const styles = createThemedStyles((theme) => ({
  intro: {
    marginTop: -theme.spacing.sm,
    marginBottom: theme.spacing.xl,
    ...theme.textVariants.body,
    color: theme.colors.mutedForeground,
  },
  card: {
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  optionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  optionTextWrap: {
    flex: 1,
  },
  optionTitle: {
    ...theme.textVariants.subtitle,
    color: theme.colors.foreground,
  },
  optionSubtitle: {
    marginTop: theme.spacing.xs,
    ...theme.textVariants.body,
    color: theme.colors.mutedForeground,
  },
  optionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  currentBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  currentBadgeText: {
    ...theme.textVariants.labelSmall,
    color: theme.colors.mutedForeground,
  },
  checkIcon: {
    color: theme.colors.primary,
  },
}))
