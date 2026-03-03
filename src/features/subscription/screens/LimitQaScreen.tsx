import AsyncStorage from '@react-native-async-storage/async-storage'
import React from 'react'
import { Alert, Text, View } from 'react-native'

import Button from '@/components/Button'
import Screen from '@/components/Screen'
import {
  KITCHEN_ALMOST_FULL_RECIPE_DISMISS_UNTIL_PREFIX,
  KITCHEN_ALMOST_FULL_STORAGE_DISMISS_UNTIL_PREFIX,
} from '@/features/subscription/constants/reminderKeys'
import {
  clearLimitQaOverrides,
  setLimitQaOverrides,
  useLimitQaOverrides,
} from '@/features/subscription/dev/limitQaOverrides'
import { resetReminderSessionState } from '@/features/subscription/dev/reminderSession'
import { createThemedStyles } from '@/styles/createStyles'

export default function LimitQaScreen() {
  const { overrides } = useLimitQaOverrides()

  const cycleRecipeBand = async () => {
    const next =
      overrides.recipeUsageBandOverride === null
        ? 'between95and99'
        : overrides.recipeUsageBandOverride === 'between95and99'
          ? 'atLimit'
          : null
    await setLimitQaOverrides({ recipeUsageBandOverride: next })
  }

  const cycleStorageBand = async () => {
    const next =
      overrides.storageUsageBandOverride === null
        ? 'between95and99'
        : overrides.storageUsageBandOverride === 'between95and99'
          ? 'atLimit'
          : null
    await setLimitQaOverrides({ storageUsageBandOverride: next })
  }

  const toggleRecipeSaveForce = async () => {
    await setLimitQaOverrides({
      forceRecipeLimitErrorOnSave: !overrides.forceRecipeLimitErrorOnSave,
    })
  }

  const toggleStorageImportForce = async () => {
    await setLimitQaOverrides({
      forceStorageLimitErrorOnImport: !overrides.forceStorageLimitErrorOnImport,
    })
  }

  const resetReminderSuppression = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys()
      const targetKeys = keys.filter(
        (key) =>
          key.startsWith(KITCHEN_ALMOST_FULL_RECIPE_DISMISS_UNTIL_PREFIX) ||
          key.startsWith(KITCHEN_ALMOST_FULL_STORAGE_DISMISS_UNTIL_PREFIX)
      )
      if (targetKeys.length > 0) {
        await AsyncStorage.multiRemove(targetKeys)
      }
      resetReminderSessionState()
      Alert.alert('Reset complete', 'Reminder suppression has been reset for QA testing.')
    } catch {
      Alert.alert('Reset failed', 'Could not reset reminder suppression keys.')
    }
  }

  return (
    <Screen scroll contentStyle={styles.content}>
      <Text style={styles.title}>Limit QA Mode</Text>
      <Text style={styles.subtitle}>Use these toggles to test 95% and 100% limit behavior quickly.</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Usage Band Overrides</Text>
        <Button variant="secondary" size="md" onPress={() => { void cycleRecipeBand() }}>
          Recipe band: {overrides.recipeUsageBandOverride ?? 'off'}
        </Button>
        <Button variant="secondary" size="md" onPress={() => { void cycleStorageBand() }}>
          Storage band: {overrides.storageUsageBandOverride ?? 'off'}
        </Button>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Force Action Failures</Text>
        <Button variant="secondary" size="md" onPress={() => { void toggleRecipeSaveForce() }}>
          Force recipe limit on save: {overrides.forceRecipeLimitErrorOnSave ? 'on' : 'off'}
        </Button>
        <Button variant="secondary" size="md" onPress={() => { void toggleStorageImportForce() }}>
          Force storage limit on import: {overrides.forceStorageLimitErrorOnImport ? 'on' : 'off'}
        </Button>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reset</Text>
        <Button variant="soft" size="md" onPress={() => { void resetReminderSuppression() }}>
          Reset 24h + session reminder suppression
        </Button>
        <Button variant="ghost" size="md" onPress={() => { void clearLimitQaOverrides() }}>
          Clear all QA overrides
        </Button>
      </View>
    </Screen>
  )
}

const styles = createThemedStyles((theme) => ({
  content: {
    gap: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing['3xl'],
  },
  title: {
    fontFamily: theme.fontFamily.bold,
    fontSize: theme.fontSize.xxl,
    lineHeight: theme.lineHeight.xxl,
    color: theme.colors.foreground,
  },
  subtitle: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
  },
  section: {
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  sectionTitle: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.foreground,
  },
}))
