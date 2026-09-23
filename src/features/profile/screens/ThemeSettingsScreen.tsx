import { Feather } from '@expo/vector-icons'
import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

import ProfileSubpageLayout from '@/features/profile/components/ProfileSubpageLayout'
import { useTranslation } from '@/localization'
import { createThemedStyles } from '@/styles/createStyles'
import { type ThemePreference, useTheme } from '@/styles/ThemeProvider'

type ThemeSettingsScreenProps = {
  onBack: () => void
}

const PREFERENCES: ThemePreference[] = ['system', 'light', 'dark']

export default function ThemeSettingsScreen({ onBack }: ThemeSettingsScreenProps) {
  const { preference, mode, setPreference } = useTheme()
  const { t } = useTranslation()

  return (
    <ProfileSubpageLayout title={t('profile.appearance.screenTitle')} onBack={onBack}>
      <Text style={styles.intro}>{t('profile.appearance.intro')}</Text>

      <View style={styles.card}>
        {PREFERENCES.map((option, index) => (
          <TouchableOpacity
            key={option}
            activeOpacity={0.8}
            onPress={() => setPreference(option)}
            style={[styles.optionRow, index !== PREFERENCES.length - 1 && styles.optionDivider]}
          >
            <View style={styles.optionTextWrap}>
              <Text style={styles.optionTitle}>{t(`profile.appearance.options.${option}.title`)}</Text>
              <Text style={styles.optionSubtitle}>
                {option === 'system'
                  ? t('profile.appearance.options.system.subtitle', { mode: t(`profile.appearance.labels.${mode}`) })
                  : t(`profile.appearance.options.${option}.subtitle`)}
              </Text>
            </View>
            {preference === option ? <Feather name="check" size={18} style={styles.checkIcon} /> : null}
          </TouchableOpacity>
        ))}
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
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  optionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  optionTextWrap: { flex: 1 },
  optionTitle: { ...theme.textVariants.subtitle, color: theme.colors.foreground },
  optionSubtitle: {
    marginTop: theme.spacing.xs,
    ...theme.textVariants.body,
    color: theme.colors.mutedForeground,
  },
  checkIcon: { color: theme.colors.primary },
}))
