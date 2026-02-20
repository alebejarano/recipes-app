import { Feather } from '@expo/vector-icons'
import React, { useMemo, useState } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

import Screen from '@/components/Screen'
import {
  FREE_PLAN_MAX_IMPORT_TOTAL_BYTES,
  FREE_PLAN_MAX_RECIPES,
} from '@/features/subscription/constants/limits'
import { buildFreePlanUsageSnapshot } from '@/features/subscription/utils/planUsage'
import { createThemedStyles } from '@/styles/createStyles'
import { theme } from '@/styles/theme'

type ProgressPreset = {
  key: string
  label: string
  recipes: number
  storageMb: number
}

const MEGABYTE = 1024 * 1024

const PRESETS: ProgressPreset[] = [
  { key: 'fresh', label: 'Fresh account', recipes: 5, storageMb: 2 },
  { key: 'heads-up', label: 'Heads-up zone (70%)', recipes: 72, storageMb: 35 },
  { key: 'close', label: 'Close to limit (85%)', recipes: 88, storageMb: 43 },
  { key: 'almost', label: 'Almost full (95%)', recipes: 97, storageMb: 48 },
  { key: 'limit', label: 'At limit', recipes: 100, storageMb: 50 },
]

type CurrentPlanProgressMockScreenProps = {
  onBack: () => void
}

export default function CurrentPlanProgressMockScreen({ onBack }: CurrentPlanProgressMockScreenProps) {
  const [recipesSaved, setRecipesSaved] = useState(28)
  const [storageMbUsed, setStorageMbUsed] = useState(10)

  const usage = useMemo(
    () => buildFreePlanUsageSnapshot(recipesSaved, storageMbUsed * MEGABYTE),
    [recipesSaved, storageMbUsed]
  )

  const applyPreset = (preset: ProgressPreset) => {
    setRecipesSaved(preset.recipes)
    setStorageMbUsed(preset.storageMb)
  }

  const increaseRecipes = () => setRecipesSaved((current) => Math.min(current + 1, FREE_PLAN_MAX_RECIPES))
  const decreaseRecipes = () => setRecipesSaved((current) => Math.max(current - 1, 0))

  const increaseStorage = () =>
    setStorageMbUsed((current) => Math.min(current + 1, Math.round(FREE_PLAN_MAX_IMPORT_TOTAL_BYTES / MEGABYTE)))
  const decreaseStorage = () => setStorageMbUsed((current) => Math.max(current - 1, 0))

  return (
    <Screen scroll bottomPadding={theme.spacing['3xl']} contentStyle={styles.content}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Go back"
          activeOpacity={0.8}
          onPress={onBack}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={20} style={styles.backIcon} />
        </TouchableOpacity>

        <View style={styles.headerTextWrap}>
          <Text style={styles.title}>Current Plan Mock</Text>
          <Text style={styles.subtitle}>Test recipe + storage progress states</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Mock presets</Text>
        <View style={styles.presetGrid}>
          {PRESETS.map((preset) => (
            <TouchableOpacity
              key={preset.key}
              activeOpacity={0.82}
              onPress={() => applyPreset(preset)}
              style={styles.presetButton}
            >
              <Text style={styles.presetLabel}>{preset.label}</Text>
              <Text style={styles.presetMeta}>
                {preset.recipes}/{FREE_PLAN_MAX_RECIPES} recipes, {preset.storageMb}MB
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Manual controls</Text>

        <View style={styles.controlRow}>
          <Text style={styles.controlLabel}>Recipes saved</Text>
          <View style={styles.counterRow}>
            <TouchableOpacity onPress={decreaseRecipes} style={styles.counterButton}>
              <Feather name="minus" size={14} style={styles.counterIcon} />
            </TouchableOpacity>
            <Text style={styles.counterValue}>{recipesSaved}</Text>
            <TouchableOpacity onPress={increaseRecipes} style={styles.counterButton}>
              <Feather name="plus" size={14} style={styles.counterIcon} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.controlRow}>
          <Text style={styles.controlLabel}>Storage used (MB)</Text>
          <View style={styles.counterRow}>
            <TouchableOpacity onPress={decreaseStorage} style={styles.counterButton}>
              <Feather name="minus" size={14} style={styles.counterIcon} />
            </TouchableOpacity>
            <Text style={styles.counterValue}>{storageMbUsed}</Text>
            <TouchableOpacity onPress={increaseStorage} style={styles.counterButton}>
              <Feather name="plus" size={14} style={styles.counterIcon} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.usageHeader}>
          <Text style={styles.usageTitle}>Recipes saved</Text>
          <Text style={styles.usageValue}>
            <Text style={styles.usageValueStrong}>{usage.recipesSaved}</Text>/{FREE_PLAN_MAX_RECIPES}
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${usage.recipesUsagePercent}%` }]} />
        </View>
        <Text style={styles.usageMessage}>{usage.recipesUsageMessage}</Text>

        <View style={styles.sectionDivider} />

        <View style={styles.usageHeader}>
          <Text style={styles.usageTitle}>Storage</Text>
          <Text style={styles.usageValue}>
            <Text style={styles.usageValueStrong}>{usage.storageMbUsed}MB</Text>/{usage.storageMbLimit}MB used
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${usage.storageUsagePercent}%` }]} />
        </View>
        <Text style={styles.usageMessage}>{usage.storageUsageMessage}</Text>
      </View>
    </Screen>
  )
}

const styles = createThemedStyles((theme) => ({
  content: {
    gap: theme.spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: theme.colors.mutedForeground,
  },
  headerTextWrap: {
    flex: 1,
  },
  title: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.display,
    lineHeight: theme.lineHeight.display,
    color: theme.colors.foreground,
  },
  subtitle: {
    marginTop: theme.spacing.xs,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.mutedForeground,
  },
  card: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.xl,
    backgroundColor: theme.colors.card,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  cardTitle: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.xl,
    lineHeight: theme.lineHeight.xl,
    color: theme.colors.foreground,
  },
  presetGrid: {
    gap: theme.spacing.sm,
  },
  presetButton: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  presetLabel: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.foreground,
  },
  presetMeta: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  controlLabel: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.foreground,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  counterButton: {
    width: 34,
    height: 34,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  counterIcon: {
    color: theme.colors.foreground,
  },
  counterValue: {
    minWidth: 36,
    textAlign: 'center',
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.xl,
    lineHeight: theme.lineHeight.xl,
    color: theme.colors.foreground,
  },
  usageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  usageTitle: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.foreground,
  },
  usageValue: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.warmGray,
  },
  usageValueStrong: {
    fontFamily: theme.fontFamily.semibold,
    color: theme.colors.foreground,
  },
  progressTrack: {
    height: 8,
    borderRadius: theme.radii.xxl,
    backgroundColor: theme.colors.secondary,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.radii.xxl,
    backgroundColor: theme.colors.primary,
  },
  usageMessage: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.mutedForeground,
  },
  sectionDivider: {
    marginVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
}))
