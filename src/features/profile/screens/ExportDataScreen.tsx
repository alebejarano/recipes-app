import { Feather } from '@expo/vector-icons'
import React, { useCallback, useState } from 'react'
import { Alert, Text, View } from 'react-native'

import Button from '@/components/Button'
import { useAuth } from '@/features/auth/context/AuthContext'
import ProfileSubpageLayout from '@/features/profile/components/ProfileSubpageLayout'
import { exportUserData } from '@/features/profile/services/exportUserData'
import { useStorageStrategy } from '@/features/storage/context/StorageStrategyContext'
import { getUserFacingErrorMessage } from '@/lib/userFacingError'
import { useTranslation } from '@/localization'
import { createThemedStyles } from '@/styles/createStyles'

type ExportDataScreenProps = {
  onBack: () => void
}

export default function ExportDataScreen({ onBack }: ExportDataScreenProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { strategy } = useStorageStrategy()
  const [isExportingData, setIsExportingData] = useState(false)

  const onExportDataPress = useCallback(async () => {
    if (isExportingData) return

    setIsExportingData(true)
    try {
      await exportUserData({
        userId: user?.id ?? null,
        email: user?.email ?? null,
        displayName: typeof user?.user_metadata?.display_name === 'string'
          ? user.user_metadata.display_name
          : null,
        storageStrategy: strategy,
      })
      Alert.alert(t('profile.exportData.readyTitle'), t('profile.exportData.readyBody'))
    } catch (error: any) {
      Alert.alert(t('profile.exportData.failedTitle'), getUserFacingErrorMessage(error))
    } finally {
      setIsExportingData(false)
    }
  }, [isExportingData, strategy, t, user?.email, user?.id, user?.user_metadata?.display_name])

  return (
    <ProfileSubpageLayout title={t('profile.exportData.title')} onBack={onBack}>
      <View style={styles.panel}>
        <View style={styles.iconWrap}>
          <Feather name="download" size={24} color={styles.icon.color} />
        </View>

        <Text style={styles.title}>{t('profile.exportData.panelTitle')}</Text>
        <Text style={styles.copy}>{t('profile.exportData.panelBody')}</Text>
        <Text style={styles.helper}>{t('profile.exportData.helper')}</Text>
      </View>

      <Button
        variant="primary"
        size="lg"
        onPress={onExportDataPress}
        style={styles.exportButton}
        loading={isExportingData}
        loadingLabel={t('profile.exportData.preparing')}
        icon={<Feather name="download" size={18} color={styles.buttonIcon.color} />}
      >
        {t('profile.exportData.button')}
      </Button>
    </ProfileSubpageLayout>
  )
}

const styles = createThemedStyles((theme) => ({
  panel: {
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: theme.radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  icon: {
    color: theme.colors.primary,
  },
  title: {
    ...theme.textVariants.heading,
    color: theme.colors.foreground,
  },
  copy: {
    ...theme.textVariants.body,
    color: theme.colors.foreground,
  },
  helper: {
    ...theme.textVariants.caption,
    color: theme.colors.mutedForeground,
  },
  buttonIcon: {
    color: theme.colors.primaryForeground,
  },
  exportButton: {
    marginTop: theme.spacing.md,
  },
}))
