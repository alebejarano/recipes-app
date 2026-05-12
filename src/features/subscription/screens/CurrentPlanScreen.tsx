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
}

type FeatureItem = {
  icon: React.ComponentProps<typeof Feather>['name']
  label: string
}

const freeFeatures: FeatureItem[] = [
  { icon: 'book-open', label: 'Up to 100 recipes' },
  { icon: 'cloud', label: '50MB total storage for imports' },
  { icon: 'coffee', label: 'Unlimited notes' },
  { icon: 'wifi-off', label: 'Stored locally on this device' },
]

const premiumFeatures: FeatureItem[] = [
  { icon: 'book-open', label: 'Unlimited recipes' },
  { icon: 'coffee', label: 'Unlimited notes' },
  { icon: 'cloud', label: '5GB secure cloud storage' },
  { icon: 'smartphone', label: 'Sync across all your devices' },
  { icon: 'wifi', label: 'Offline access + Automatic backup' },
]

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
    return "Your Free kitchen is full for recipes and storage."
  }

  if (recipesAtLimit) {
    return "Your Free kitchen is full for recipes."
  }

  if (storageAtLimit) {
    return "Your Free kitchen is full for storage."
  }

  const highestUsage = Math.max(recipesUsagePercent, storageUsagePercent)

  if (highestUsage < 80) return null

  if (recipesUsagePercent >= 80 && storageUsagePercent >= 80) {
    return "Recipes and storage are both getting close to full."
  }

  if (recipesUsagePercent >= 80) {
    return "You're getting close to the recipe limit on Free."
  }

  if (storageUsagePercent >= 80) {
    return "You're getting close to the storage limit on Free."
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
          {getUserFacingErrorMessage(error, 'Unable to load usage right now.')}
        </Text>
      ) : (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={styles.loadingText.color} />
          <Text style={styles.loadingText}>Loading usage…</Text>
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
  premiumNextRenewalLabel = 'Renews Mar 27, 2026',
}: CurrentPlanScreenProps) {
  const recipesQuery = useStrategyRecipesList({ limit: 2000 }, mode)
  const storageUsageQuery = useRecipeDocumentUsageSummary()
  const usageIsLoading = recipesQuery.isLoading || storageUsageQuery.isLoading
  const usageIsError = recipesQuery.isError || storageUsageQuery.isError
  const usageError = recipesQuery.error ?? storageUsageQuery.error

  const recipesSaved = recipesQuery.data?.length ?? 0
  const storageBytesUsed = storageUsageQuery.data?.totalBytes ?? 0

  if (accountType === 'premium') {
    const storagePercent = Math.min((storageBytesUsed / PREMIUM_PLAN_MAX_STORAGE_BYTES) * 100, 100)
    const manageSubscription = onManageSubscription ?? onUpgrade

    return (
      <Screen scroll bottomPadding={theme.spacing['3xl']} contentStyle={styles.content}>
        <TouchableOpacity style={styles.backRow} onPress={onBack} activeOpacity={0.75}>
          <Feather name="chevron-left" size={18} style={styles.backIcon} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.pageTitle}>Your Kitchen Plan</Text>
          <View style={styles.planPillWrap}>
            <PlanPill label="Premium" premium />
          </View>
        </View>

        {usageIsLoading || usageIsError ? (
          <UsageStatusCard title="Your kitchen" isError={usageIsError} error={usageError} />
        ) : (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Your kitchen</Text>

            <View style={styles.usageRowHeader}>
              <Text style={styles.usageRowLabel}>Recipes synced</Text>
              <Text style={styles.usageRowValue}>{recipesSaved}</Text>
            </View>

            <UsageProgressRow
              label="Cloud storage"
              value={`${formatStorageGigabytes(storageBytesUsed)} / 5GB`}
              percent={storagePercent}
            />
          </View>
        )}

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeading}>Your benefits</Text>

          <View style={[styles.planCard, styles.premiumPlanCard]}>
            <View style={styles.planCardHeader}>
              <Text style={styles.planName}>PREMIUM</Text>
              <PlanPill label="Current" premium />
            </View>

            <View style={styles.planMetaBlock}>
              <Text style={styles.planMetaText}>{premiumPlanLabel}</Text>
              <Text style={styles.planMetaSubtext}>{premiumNextRenewalLabel}</Text>
            </View>

            <FeatureList items={premiumFeatures} premium />
          </View>
        </View>

        <Text style={styles.supportText}>Thanks for supporting independent development.</Text>

        <Button onPress={manageSubscription} variant="secondary" size="md" style={styles.manageButton}>
          Manage Subscription
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
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.pageTitle}>Your Kitchen Plan</Text>
        <View style={styles.planPillWrap}>
          <PlanPill label="Free" />
        </View>
      </View>

      {usageIsLoading || usageIsError ? (
        <UsageStatusCard title="Your usage" isError={usageIsError} error={usageError} />
      ) : (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Your usage</Text>

          <UsageProgressRow
            label="Recipes saved"
            value={`${recipesSaved} / ${FREE_PLAN_MAX_RECIPES}`}
            percent={usage.recipesUsagePercent}
            fillColor={getFreeUsageProgressColor(usage.recipesUsagePercent)}
          />

          <UsageProgressRow
            label="Storage used"
            value={`${usage.storageMbUsed}MB / ${usage.storageMbLimit}MB`}
            percent={usage.storageUsagePercent}
            fillColor={getFreeUsageProgressColor(usage.storageUsagePercent)}
          />

          <Text style={styles.usageMessage}>{usageMessage}</Text>
        </View>
      )}

      <View style={styles.sectionBlock}>
        <Text style={styles.sectionHeading}>Compare plans</Text>

        <View style={styles.planCard}>
          <View style={styles.planCardHeader}>
            <Text style={styles.planName}>FREE</Text>
            <PlanPill label="Current" />
          </View>
          <FeatureList items={freeFeatures} />
        </View>

        <View style={[styles.planCard, styles.premiumPlanCard]}>
          <View style={styles.planCardHeader}>
            <Text style={styles.planName}>PREMIUM</Text>
            <PlanPill label="Recommended" premium />
          </View>
          <FeatureList items={premiumFeatures} premium />
        </View>
      </View>

      <View style={styles.ctaBlock}>
        <Button onPress={onUpgrade} variant="premium" size="xl" style={styles.ctaButton}>
          Unlock Premium
        </Button>
        <Text style={styles.pricingText}>€5/month · €36/year</Text>

        <View style={styles.ctaNotes}>
          <Text style={styles.ctaNote}>Your recipes will be safely backed up to the cloud.</Text>
          <Text style={styles.ctaNote}>Nothing will be deleted.</Text>
          <Text style={styles.ctaNote}>Cancel anytime.</Text>
        </View>

        {usage.upgradeUsageBand === 'atLimit' ? (
          <Button onPress={handleManageExistingRecipes} size="md" variant="secondary">
            Manage existing recipes
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  backIcon: {
    color: theme.colors.mutedForeground,
  },
  backText: {
    marginLeft: theme.spacing.xs,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
  },
  header: {
    alignItems: 'center',
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  pageTitle: {
    textAlign: 'center',
    fontFamily: theme.fontFamily.bold,
    fontSize: theme.fontSize.display,
    lineHeight: theme.lineHeight.display,
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
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
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
    fontFamily: theme.fontFamily.bold,
    fontSize: theme.fontSize.xl,
    lineHeight: theme.lineHeight.xl,
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
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
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
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.mutedForeground,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  loadingText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
  },
  sectionBlock: {
    gap: theme.spacing.md,
  },
  sectionHeading: {
    fontFamily: theme.fontFamily.bold,
    fontSize: theme.fontSize.xxl,
    lineHeight: theme.lineHeight.xxl,
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
    fontFamily: theme.fontFamily.bold,
    fontSize: theme.fontSize.xl,
    lineHeight: theme.lineHeight.xl,
    color: theme.colors.foreground,
    letterSpacing: 0.8,
  },
  planMetaBlock: {
    gap: theme.spacing.xxs,
  },
  planMetaText: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.foreground,
  },
  planMetaSubtext: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
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
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
  },
  ctaNotes: {
    marginTop: theme.spacing.sm,
    gap: theme.spacing.xxs,
  },
  ctaNote: {
    textAlign: 'center',
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.mutedForeground,
  },
  supportText: {
    textAlign: 'center',
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
  },
  manageButton: {
    marginTop: theme.spacing.sm,
  },
}))
