import { Feather } from '@expo/vector-icons'
import React from 'react'
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native'

import Button from '@/components/Button'
import Screen from '@/components/Screen'
import { useRecipeDocumentUsageSummary } from '@/features/recipes/hooks/useRecipeDocuments'
import { useStrategyRecipesList } from '@/features/recipes/hooks/useStrategyRecipes'
import type { StorageScreenMode } from '@/features/storage/hooks/useStorageDataMode'
import {
  FREE_PLAN_MAX_RECIPES,
  PREMIUM_PLAN_MAX_STORAGE_BYTES,
} from '@/features/subscription/constants/limits'
import { buildFreePlanUsageSnapshot } from '@/features/subscription/utils/planUsage'
import { getUserFacingErrorMessage } from '@/lib/userFacingError'
import { i18n } from '@/localization/i18n'
import { createThemedStyles } from '@/styles/createStyles'
import { theme } from '@/styles/theme'

type CurrentPlanScreenProps = {
  accountType: 'guest' | 'free' | 'premium'
  mode?: StorageScreenMode
  onBack: () => void
  onUpgrade: () => void
  onManageExistingRecipes?: () => void
  onManageSubscription?: () => void
  premiumPlanLabel?: string
  premiumNextRenewalLabel?: string
  premiumPricingLabel?: string | null
}

type FeatureItem = {
  icon: React.ComponentProps<typeof Feather>['name']
  label: string
}

function formatStorageGigabytes(bytes: number) {
  const gigabytes = bytes / (1024 * 1024 * 1024)
  return `${Math.max(0, Math.round(gigabytes * 10) / 10)}GB`
}

function UsageProgressRow({
  label,
  value,
  percent,
  fillColor,
}: {
  label: string
  value: string
  percent: number
  fillColor?: string
}) {
  return (
    <View style={styles.usageRowWrap}>
      <View style={styles.usageRowHeader}>
        <Text style={styles.usageRowLabel}>{label}</Text>
        <Text style={styles.usageRowValue}>{value}</Text>
      </View>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${Math.min(Math.max(percent, 0), 100)}%`,
              backgroundColor: fillColor ?? theme.colors.accent,
            },
          ]}
        />
      </View>
    </View>
  )
}

function getFreeUsageProgressColor(percent: number) {
  if (percent >= 100) return theme.colors.destructive
  if (percent >= 80) return theme.colors.accent
  if (percent >= 60) return theme.colors.secondaryForeground
  return theme.colors.warmGray
}

function getFreeUsageSummaryMessage(recipesUsagePercent: number, storageUsagePercent: number) {
  const recipesAtLimit = recipesUsagePercent >= 100
  const storageAtLimit = storageUsagePercent >= 100

  if (recipesAtLimit && storageAtLimit) {
    return i18n.t('subscription.currentPlan.messages.fullBoth')
  }

  if (recipesAtLimit) {
    return i18n.t('subscription.currentPlan.messages.fullRecipes')
  }

  if (storageAtLimit) {
    return i18n.t('subscription.currentPlan.messages.fullStorage')
  }

  const highestUsage = Math.max(recipesUsagePercent, storageUsagePercent)

  if (highestUsage < 80) return null

  if (recipesUsagePercent >= 80 && storageUsagePercent >= 80) {
    return i18n.t('subscription.currentPlan.messages.closeBoth')
  }

  if (recipesUsagePercent >= 80) {
    return i18n.t('subscription.currentPlan.messages.closeRecipes')
  }

  if (storageUsagePercent >= 80) {
    return i18n.t('subscription.currentPlan.messages.closeStorage')
  }

  return null
}

function FeatureList({ items, premium = false }: { items: FeatureItem[]; premium?: boolean }) {
  return (
    <View style={styles.featuresList}>
      {items.map((item) => (
        <View key={item.label} style={styles.featureRow}>
          <Feather
            name={item.icon}
            size={18}
            style={premium ? styles.featureIconPremium : styles.featureIcon}
          />
          <Text style={styles.featureText}>{item.label}</Text>
        </View>
      ))}
    </View>
  )
}

function PlanPill({ label, premium = false }: { label: string; premium?: boolean }) {
  return (
    <View style={[styles.planPill, premium && styles.planPillPremium]}>
      <Text style={[styles.planPillText, premium && styles.planPillTextPremium]}>{label}</Text>
    </View>
  )
}

function UsageStatusCard({
  title,
  isError,
  error,
}: {
  title: string
  isError?: boolean
  error?: unknown
}) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {isError ? (
        <Text style={styles.usageMessage}>
          {getUserFacingErrorMessage(error, i18n.t('subscription.currentPlan.usageLoadFailed'))}
        </Text>
      ) : (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={styles.loadingText.color} />
          <Text style={styles.loadingText}>{i18n.t('subscription.currentPlan.loadingUsage')}</Text>
        </View>
      )}
    </View>
  )
}

export default function CurrentPlanScreen({
  accountType,
  mode = 'auth',
  onBack,
  onUpgrade,
  onManageExistingRecipes,
  onManageSubscription,
  premiumPlanLabel = '€5/month',
  premiumNextRenewalLabel = i18n.t('subscription.premium.renewsOn', { date: 'Mar 27, 2026' }),
  premiumPricingLabel,
}: CurrentPlanScreenProps) {
  const recipesQuery = useStrategyRecipesList({ limit: 2000 }, mode)
  const storageUsageQuery = useRecipeDocumentUsageSummary()
  const usageIsLoading = recipesQuery.isLoading || storageUsageQuery.isLoading
  const usageIsError = recipesQuery.isError || storageUsageQuery.isError
  const usageError = recipesQuery.error ?? storageUsageQuery.error

  const recipesSaved = recipesQuery.data?.length ?? 0
  const storageBytesUsed = storageUsageQuery.data?.totalBytes ?? 0
  const freeFeatures: FeatureItem[] = [
    { icon: 'book-open', label: i18n.t('subscription.currentPlan.freeFeatures.recipes') },
    { icon: 'cloud', label: i18n.t('subscription.currentPlan.freeFeatures.storage') },
    { icon: 'coffee', label: i18n.t('subscription.currentPlan.freeFeatures.notes') },
    { icon: 'wifi-off', label: i18n.t('subscription.currentPlan.freeFeatures.local') },
  ]
  const premiumFeatures: FeatureItem[] = [
    { icon: 'book-open', label: i18n.t('subscription.currentPlan.premiumFeatures.recipes') },
    { icon: 'coffee', label: i18n.t('subscription.currentPlan.premiumFeatures.notes') },
    { icon: 'cloud', label: i18n.t('subscription.currentPlan.premiumFeatures.storage') },
    { icon: 'smartphone', label: i18n.t('subscription.currentPlan.premiumFeatures.sync') },
    { icon: 'wifi', label: i18n.t('subscription.currentPlan.premiumFeatures.backup') },
  ]

  if (accountType === 'premium') {
    const storagePercent = Math.min((storageBytesUsed / PREMIUM_PLAN_MAX_STORAGE_BYTES) * 100, 100)
    const manageSubscription = onManageSubscription ?? onUpgrade

    return (
      <Screen scroll bottomPadding={theme.spacing['3xl']} contentStyle={styles.content}>
        <TouchableOpacity style={styles.backRow} onPress={onBack} activeOpacity={0.75}>
          <Feather name="chevron-left" size={18} style={styles.backIcon} />
          <Text style={styles.backText}>{i18n.t('subscription.currentPlan.back')}</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.pageTitle}>{i18n.t('subscription.currentPlan.title')}</Text>
          <View style={styles.planPillWrap}>
            <PlanPill label={i18n.t('subscription.currentPlan.premium')} premium />
          </View>
        </View>

        {usageIsLoading || usageIsError ? (
          <UsageStatusCard title={i18n.t('subscription.currentPlan.yourKitchen')} isError={usageIsError} error={usageError} />
        ) : (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{i18n.t('subscription.currentPlan.yourKitchen')}</Text>

            <View style={styles.usageRowHeader}>
              <Text style={styles.usageRowLabel}>{i18n.t('subscription.currentPlan.recipesSynced')}</Text>
              <Text style={styles.usageRowValue}>{recipesSaved}</Text>
            </View>

            <UsageProgressRow
              label={i18n.t('subscription.currentPlan.cloudStorage')}
              value={`${formatStorageGigabytes(storageBytesUsed)} / 5GB`}
              percent={storagePercent}
            />
          </View>
        )}

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeading}>{i18n.t('subscription.currentPlan.yourBenefits')}</Text>

          <View style={[styles.planCard, styles.premiumPlanCard]}>
            <View style={styles.planCardHeader}>
              <Text style={styles.planName}>{i18n.t('subscription.currentPlan.premium').toUpperCase()}</Text>
              <PlanPill label={i18n.t('subscription.currentPlan.current')} premium />
            </View>

            <View style={styles.planMetaBlock}>
              <Text style={styles.planMetaText}>{premiumPlanLabel}</Text>
              <Text style={styles.planMetaSubtext}>{premiumNextRenewalLabel}</Text>
            </View>

            <FeatureList items={premiumFeatures} premium />
          </View>
        </View>

        <Text style={styles.supportText}>{i18n.t('subscription.currentPlan.thanks')}</Text>

        <Button onPress={manageSubscription} variant="secondary" size="md" style={styles.manageButton}>
          {i18n.t('subscription.currentPlan.manageSubscription')}
        </Button>
      </Screen>
    )
  }

  const usage = buildFreePlanUsageSnapshot(recipesSaved, storageBytesUsed)
  const usageMessage = getFreeUsageSummaryMessage(usage.recipesUsagePercent, usage.storageUsagePercent)
  const handleManageExistingRecipes = onManageExistingRecipes ?? onBack

  return (
    <Screen scroll bottomPadding={theme.spacing['3xl']} contentStyle={styles.content}>
      <TouchableOpacity style={styles.backRow} onPress={onBack} activeOpacity={0.75}>
        <Feather name="chevron-left" size={18} style={styles.backIcon} />
        <Text style={styles.backText}>{i18n.t('subscription.currentPlan.back')}</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.pageTitle}>{i18n.t('subscription.currentPlan.title')}</Text>
        <View style={styles.planPillWrap}>
          <PlanPill label={i18n.t('subscription.currentPlan.free')} />
        </View>
      </View>

      {usageIsLoading || usageIsError ? (
        <UsageStatusCard title={i18n.t('subscription.currentPlan.yourUsage')} isError={usageIsError} error={usageError} />
      ) : (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{i18n.t('subscription.currentPlan.yourUsage')}</Text>

          <UsageProgressRow
            label={i18n.t('subscription.currentPlan.recipesSaved')}
            value={`${recipesSaved} / ${FREE_PLAN_MAX_RECIPES}`}
            percent={usage.recipesUsagePercent}
            fillColor={getFreeUsageProgressColor(usage.recipesUsagePercent)}
          />

          <UsageProgressRow
            label={i18n.t('subscription.currentPlan.storageUsed')}
            value={`${usage.storageMbUsed}MB / ${usage.storageMbLimit}MB`}
            percent={usage.storageUsagePercent}
            fillColor={getFreeUsageProgressColor(usage.storageUsagePercent)}
          />

          <Text style={styles.usageMessage}>{usageMessage}</Text>
        </View>
      )}

      <View style={styles.sectionBlock}>
        <Text style={styles.sectionHeading}>{i18n.t('subscription.currentPlan.comparePlans')}</Text>

        <View style={styles.planCard}>
          <View style={styles.planCardHeader}>
            <Text style={styles.planName}>{i18n.t('subscription.currentPlan.free').toUpperCase()}</Text>
            <PlanPill label={i18n.t('subscription.currentPlan.current')} />
          </View>
          <FeatureList items={freeFeatures} />
        </View>

        <View style={[styles.planCard, styles.premiumPlanCard]}>
          <View style={styles.planCardHeader}>
            <Text style={styles.planName}>{i18n.t('subscription.currentPlan.premium').toUpperCase()}</Text>
            <PlanPill label={i18n.t('subscription.currentPlan.recommended')} premium />
          </View>
          <FeatureList items={premiumFeatures} premium />
        </View>
      </View>

      <View style={styles.ctaBlock}>
        <Button onPress={onUpgrade} variant="premium" size="xl" style={styles.ctaButton}>
          {i18n.t('subscription.currentPlan.unlockPremium')}
        </Button>
        {premiumPricingLabel ? (
          <Text style={styles.pricingText}>{premiumPricingLabel}</Text>
        ) : null}

        <View style={styles.ctaNotes}>
          <Text style={styles.ctaNote}>{i18n.t('subscription.currentPlan.backupNote')}</Text>
          <Text style={styles.ctaNote}>{i18n.t('subscription.currentPlan.nothingDeleted')}</Text>
          <Text style={styles.ctaNote}>{i18n.t('subscription.currentPlan.cancelAnytime')}</Text>
        </View>

        {usage.upgradeUsageBand === 'atLimit' ? (
          <Button onPress={handleManageExistingRecipes} size="md" variant="secondary">
            {i18n.t('subscription.currentPlan.manageExistingRecipes')}
          </Button>
        ) : null}
      </View>
    </Screen>
  )
}

const styles = createThemedStyles((theme) => ({
  content: {
    gap: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
  },
  backRow: {
    width: '100%',
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  backIcon: {
    color: theme.colors.mutedForeground,
  },
  backText: {
    marginLeft: theme.spacing.xs,
    ...theme.textVariants.body,
    color: theme.colors.mutedForeground,
  },
  header: {
    alignItems: 'center',
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  pageTitle: {
    textAlign: 'center',
    ...theme.textVariants.display,
    color: theme.colors.foreground,
  },
  planPillWrap: {
    marginTop: theme.spacing.md,
  },
  planPill: {
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  planPillPremium: {
    backgroundColor: theme.colors.primarySoft,
  },
  planPillText: {
    ...theme.textVariants.subtitle,
    color: theme.colors.secondaryForeground,
  },
  planPillTextPremium: {
    color: theme.colors.primaryDark,
  },
  sectionCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.xl,
    backgroundColor: theme.colors.card,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.textVariants.heading,
    color: theme.colors.foreground,
  },
  usageRowWrap: {
    gap: theme.spacing.xs,
  },
  usageRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  usageRowLabel: {
    flex: 1,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.foreground,
  },
  usageRowValue: {
    ...theme.textVariants.subtitle,
    color: theme.colors.warmGray,
  },
  progressTrack: {
    height: 12,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.secondary,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.radii.full,
  },
  usageMessage: {
    marginTop: theme.spacing.xs,
    ...theme.textVariants.caption,
    color: theme.colors.mutedForeground,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  loadingText: {
    ...theme.textVariants.label,
    color: theme.colors.mutedForeground,
  },
  sectionBlock: {
    gap: theme.spacing.md,
  },
  sectionHeading: {
    ...theme.textVariants.title,
    color: theme.colors.foreground,
  },
  planCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.xl,
    backgroundColor: theme.colors.card,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  premiumPlanCard: {
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.primarySoft,
  },
  planCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planName: {
    ...theme.textVariants.heading,
    color: theme.colors.foreground,
    letterSpacing: 0.8,
  },
  planMetaBlock: {
    gap: theme.spacing.xxs,
  },
  planMetaText: {
    ...theme.textVariants.subtitle,
    color: theme.colors.foreground,
  },
  planMetaSubtext: {
    ...theme.textVariants.caption,
    color: theme.colors.mutedForeground,
  },
  featuresList: {
    gap: theme.spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  featureIcon: {
    color: theme.colors.mutedForeground,
  },
  featureIconPremium: {
    color: theme.colors.primaryDark,
  },
  featureText: {
    flex: 1,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.foreground,
  },
  ctaBlock: {
    alignItems: 'center',
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  ctaButton: {
    width: '100%',
  },
  pricingText: {
    textAlign: 'center',
    ...theme.textVariants.body,
    color: theme.colors.mutedForeground,
  },
  ctaNotes: {
    marginTop: theme.spacing.sm,
    gap: theme.spacing.xxs,
  },
  ctaNote: {
    textAlign: 'center',
    ...theme.textVariants.caption,
    color: theme.colors.mutedForeground,
  },
  supportText: {
    textAlign: 'center',
    ...theme.textVariants.body,
    color: theme.colors.mutedForeground,
  },
  manageButton: {
    marginTop: theme.spacing.sm,
  },
}))
