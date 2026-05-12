import { Feather } from '@expo/vector-icons'
import React, { useCallback, useState } from 'react'
import { Alert, Text, View } from 'react-native'

import Button from '@/components/Button'
import { useAuth } from '@/features/auth/context/AuthContext'
import ProfileSubpageLayout from '@/features/profile/components/ProfileSubpageLayout'
import { exportUserData } from '@/features/profile/services/exportUserData'
import { useStorageStrategy } from '@/features/storage/context/StorageStrategyContext'
import { getUserFacingErrorMessage } from '@/lib/userFacingError'
import { createThemedStyles } from '@/styles/createStyles'

type ExportDataScreenProps = {
  onBack: () => void
}

export default function ExportDataScreen({ onBack }: ExportDataScreenProps) {
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
      Alert.alert('Export ready', 'Your data export has been prepared and opened in the share sheet.')
    } catch (error: any) {
      Alert.alert('Unable to export data', getUserFacingErrorMessage(error))
    } finally {
      setIsExportingData(false)
    }
  }, [isExportingData, strategy, user?.email, user?.id, user?.user_metadata?.display_name])

  return (
    <ProfileSubpageLayout title="Export recipes & data" onBack={onBack}>
      <View style={styles.panel}>
        <View style={styles.iconWrap}>
          <Feather name="download" size={24} color={styles.icon.color} />
        </View>

        <Text style={styles.title}>Download your data</Text>
        <Text style={styles.copy}>
          Create a JSON export with your saved recipes, notes, folders, recipe files metadata,
          shopping list, and basic account details. You can keep it for your records or share it
          using your device share sheet.
        </Text>
        <Text style={styles.helper}>
          The export is generated only when you tap the button below. It does not change or delete
          anything in your account.
        </Text>
      </View>

      <Button
        variant="primary"
        size="lg"
        onPress={onExportDataPress}
        loading={isExportingData}
        loadingLabel="Preparing export..."
        icon={<Feather name="download" size={18} color={styles.buttonIcon.color} />}
      >
        Download data
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
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.xl,
    lineHeight: theme.lineHeight.xl,
    color: theme.colors.foreground,
  },
  copy: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.foreground,
  },
  helper: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.mutedForeground,
  },
  buttonIcon: {
    color: theme.colors.primaryForeground,
  },
}))
