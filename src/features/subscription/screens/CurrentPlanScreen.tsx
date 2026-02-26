import { Feather } from '@expo/vector-icons'
import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

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
import { createThemedStyles } from '@/styles/createStyles'
import { theme } from '@/styles/theme'

type CurrentPlanScreenProps = {
  accountType: 'guest' | 'free' | 'premium'
  mode?: StorageScreenMode
  onBack: () => void
  onUpgrade: () => void
  onManageExistingRecipes?: () => void
  onManageSubscription?: () => void
  onDeactivatePremiumForTest?: () => void
  premiumPlanLabel?: string
  premiumNextRenewalLabel?: string
  highlightSubscriptionCard?: boolean
}

const premiumFeatures = [
  'Unlimited recipes',
  'Unlimited notes',
  '10MB max per import file',
  '5GB cloud storage',
  'Sync across devices',
  'Automatic recipe import',
  'Offline access + cloud sync',
]

const freeFeatures = [
  'Up to 100 recipes',
  '50MB total storage',
  'Unlimited notes',
  'Offline access',
]

function formatStorageGigabytes(bytes: number) {
  const gigabytes = bytes / (1024 * 1024 * 1024)
  return `${Math.max(0, Math.round(gigabytes * 10) / 10)}GB`
}

export default function CurrentPlanScreen({
  accountType,
  mode = 'auth',
  onBack,
  onUpgrade,
  onManageExistingRecipes,
  onManageSubscription,
  onDeactivatePremiumForTest,
  premiumPlanLabel = '€5/month',
  premiumNextRenewalLabel = 'March 18, 2026',
  highlightSubscriptionCard = false,
}: CurrentPlanScreenProps) {
  const recipesQuery = useStrategyRecipesList({ limit: 2000 }, mode)
  const storageUsageQuery = useRecipeDocumentUsageSummary()

  const recipesSaved = recipesQuery.data?.length ?? 0
  const storageBytesUsed = storageUsageQuery.data?.totalBytes ?? 0

  if (accountType === 'premium') {
    const storagePercent = Math.min((storageBytesUsed / PREMIUM_PLAN_MAX_STORAGE_BYTES) * 100, 100)
    const manageSubscription = onManageSubscription ?? onUpgrade

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
            <Text style={styles.title}>Current Plan: Premium</Text>
            <Text style={styles.subtitle}>Plan & Subscription</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.usageHeader}>
            <Text style={styles.usageTitle}>Recipes synced</Text>
            <Text style={styles.usageValue}>
              <Text style={styles.usageValueStrong}>{recipesSaved}</Text>
            </Text>
          </View>

          <Text style={styles.unlimitedRecipesText}>Unlimited recipes on Premium.</Text>

          <View style={styles.sectionDivider} />

          <View style={styles.usageHeader}>
            <Text style={styles.usageTitle}>Storage</Text>
            <Text style={styles.usageValue}>
              <Text style={styles.usageValueStrong}>{formatStorageGigabytes(storageBytesUsed)}</Text> / 5GB
            </Text>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                styles.progressFillPremium,
                { width: `${storagePercent}%` },
              ]}
            />
          </View>
        </View>

        <Text style={styles.supportText}>Thank you for supporting independent development.</Text>

        <View style={[styles.card, highlightSubscriptionCard && styles.subscriptionCardHighlighted]}>
          <Text style={styles.subscriptionTitle}>Subscription</Text>

          <View style={styles.subscriptionRow}>
            <Text style={styles.subscriptionLabel}>Plan</Text>
            <Text style={styles.subscriptionValue}>{premiumPlanLabel}</Text>
          </View>

          <View style={styles.subscriptionRow}>
            <Text style={styles.subscriptionLabel}>Next renewal</Text>
            <Text style={styles.subscriptionValue}>{premiumNextRenewalLabel}</Text>
          </View>

          <Button onPress={manageSubscription} variant="soft" size="md" style={styles.manageSubscriptionButton}>
            Manage Subscription
          </Button>
        </View>

        <Text style={styles.supportFootnote}>
          Premium helps keep the app simple, private, and sustainable.
        </Text>

        {onDeactivatePremiumForTest ? (
          <Button
            onPress={onDeactivatePremiumForTest}
            variant="secondary"
            size="md"
          >
            Deactivate Premium (Test)
          </Button>
        ) : null}
      </Screen>
    )
  }

  const usage = buildFreePlanUsageSnapshot(recipesSaved, storageBytesUsed)
  const handleManageExistingRecipes = onManageExistingRecipes ?? onBack

  const currentPlanLabel = accountType === 'guest' ? 'Guest' : 'Free'
  const subtitle =
    accountType === 'guest'
      ? 'You are in Guest mode (Free plan).'
      : 'Free plan'

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
          <Text style={styles.title}>Current Plan: {currentPlanLabel}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.usageHeader}>
          <Text style={styles.usageTitle}>Recipes saved</Text>
          <Text style={styles.usageValue}>
            <Text style={styles.usageValueStrong}>{recipesSaved}</Text>/{FREE_PLAN_MAX_RECIPES}
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
            <Text style={styles.usageValueStrong}>{usage.storageMbUsed}MB</Text>/{usage.storageMbLimit}
            MB used
          </Text>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${usage.storageUsagePercent}%` }]} />
        </View>

        <Text style={styles.usageMessage}>{usage.storageUsageMessage}</Text>

        {usage.upgradeUsageBand === 'between70and84' ? (
          <Text style={styles.inlineUpgradeHint}>
            Upgrade to Premium for unlimited recipes and cloud sync.
          </Text>
        ) : null}

        {usage.upgradeUsageBand === 'between85and94' ? (
          <View style={styles.usagePromptWrap}>
            <Button onPress={onUpgrade} variant="ghost" size="md" style={styles.ghostCta}>
              Learn about Premium
            </Button>
          </View>
        ) : null}

        {usage.upgradeUsageBand === 'between95and99' ? (
          <View style={styles.usagePromptWrap}>
            <Button onPress={onUpgrade} variant="premium" size="md">
              Upgrade to Premium
            </Button>
            <Text style={styles.upgradeMicrocopy}>
              Premium removes limits and securely backs up your library.
            </Text>
          </View>
        ) : null}

        {usage.upgradeUsageBand === 'atLimit' ? (
          <View style={styles.usagePromptWrap}>
            <Text style={styles.limitReachedText}>You&apos;ve reached the Free plan limit.</Text>
            <Button onPress={onUpgrade} variant="premium" size="md">
              Upgrade to Premium
            </Button>
            <Button
              onPress={handleManageExistingRecipes}
              size="md"
              variant="secondary"
            >
              Manage existing recipes
            </Button>
          </View>
        ) : null}
      </View>

      <View style={styles.card}>
        <View style={styles.planHeader}>
          <Text style={styles.planTitle}>{currentPlanLabel}</Text>
          <View style={styles.currentPill}>
            <Text style={styles.currentPillText}>Current</Text>
          </View>
        </View>

        <View style={styles.featuresList}>
          {freeFeatures.map((feature) => (
            <View key={feature} style={styles.featureRow}>
              <View style={styles.featureIconWrap}>
                <Feather name="check" size={14} style={styles.featureIcon} />
              </View>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <View style={styles.divider} />
        <Text style={styles.planFootnote}>Everything stays on this device.</Text>
      </View>

      <View style={[styles.card, styles.premiumCard]}>
        <View style={styles.planHeader}>
          <Text style={styles.planTitle}>Premium</Text>
          <Feather name="cloud" size={16} style={styles.premiumCloudIcon} />
        </View>

        <View style={styles.featuresList}>
          {premiumFeatures.map((feature, index) => (
            <View key={`${feature}-${index}`} style={styles.featureRow}>
              <View style={[styles.featureIconWrap, styles.featureIconWrapPremium]}>
                <Feather name="check" size={14} style={styles.featureIconPremium} />
              </View>
              <Text style={[styles.featureText, index === 0 && styles.featureTextStrong]}>{feature}</Text>
            </View>
          ))}
        </View>

        <View style={styles.divider} />
        <Text style={styles.premiumFootnote}>
          Designed for cooks who want their library safe and accessible everywhere.
        </Text>
      </View>

      <Button onPress={onUpgrade} variant="premium" size="xl">
        Upgrade to Premium
      </Button>

      <Text style={styles.pricingText}>€5/month or €36/year</Text>
      <Text style={styles.pricingSubtext}>It&apos;s €5. Not €4.99. We cook honestly.</Text>

      <View style={styles.noteCard}>
        <View style={styles.noteRow}>
          <Feather name="check" size={16} style={styles.noteIcon} />
          <Text style={styles.noteText}>Your existing recipes will be automatically imported.</Text>
        </View>
        <View style={styles.noteRow}>
          <Feather name="check" size={16} style={styles.noteIcon} />
          <Text style={styles.noteText}>Nothing will be deleted.</Text>
        </View>
        <View style={styles.noteRow}>
          <Feather name="check" size={16} style={styles.noteIcon} />
          <Text style={styles.noteText}>Cancel anytime.</Text>
        </View>
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
    fontSize: theme.fontSize.xl,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.primaryDark,
    fontWeight: theme.fontWeight.semibold
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
  subscriptionCardHighlighted: {
    borderColor: theme.colors.accent,
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
  progressFillPremium: {
    backgroundColor: theme.colors.primary,
  },
  sectionDivider: {
    marginVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  usageMessage: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.mutedForeground,
  },
  unlimitedRecipesText: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.mutedForeground,
  },
  inlineUpgradeHint: {
    marginTop: theme.spacing.xs,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
  },
  usagePromptWrap: {
    marginTop: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  ghostCta: {
    width: 'auto',
    alignSelf: 'flex-start',
    paddingHorizontal: 0,
  },
  upgradeMicrocopy: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
  },
  limitReachedText: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.foreground,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  planTitle: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.xxl,
    lineHeight: theme.lineHeight.xxl,
    color: theme.colors.foreground,
  },
  currentPill: {
    borderRadius: theme.radii.xxl,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.secondary,
  },
  currentPillText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
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
  featureIconWrap: {
    width: 28,
    height: 28,
    borderRadius: theme.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.secondary,
  },
  featureIconWrapPremium: {
    backgroundColor: theme.colors.background,
  },
  featureIcon: {
    color: theme.colors.warmGray,
  },
  featureIconPremium: {
    color: theme.colors.primary,
  },
  featureText: {
    flex: 1,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.xl,
    lineHeight: theme.lineHeight.xl,
    color: theme.colors.foreground,
  },
  featureTextStrong: {
    fontFamily: theme.fontFamily.semibold,
  },
  divider: {
    marginTop: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  planFootnote: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.mutedForeground,
  },
  premiumCard: {
    backgroundColor: theme.colors.primarySoft,
  },
  premiumCloudIcon: {
    color: theme.colors.primary,
  },
  premiumFootnote: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.mutedForeground,
    fontStyle: 'italic',
  },
  pricingText: {
    marginTop: -theme.spacing.md,
    textAlign: 'center',
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.xl,
    lineHeight: theme.lineHeight.xl,
    color: theme.colors.foreground,
  },
  pricingSubtext: {
    marginTop: -theme.spacing.md,
    textAlign: 'center',
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.mutedForeground,
  },
  noteCard: {
    marginTop: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.card,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  noteIcon: {
    color: theme.colors.mutedForeground,
    marginTop: theme.spacing.xs,
  },
  noteText: {
    flex: 1,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.mutedForeground,
  },
  supportText: {
    textAlign: 'center',
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.mutedForeground,
  },
  subscriptionTitle: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.xxl,
    lineHeight: theme.lineHeight.xxl,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },
  subscriptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subscriptionLabel: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.xl,
    lineHeight: theme.lineHeight.xl,
    color: theme.colors.mutedForeground,
  },
  subscriptionValue: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.xl,
    lineHeight: theme.lineHeight.xl,
    color: theme.colors.foreground,
  },
  manageSubscriptionButton: {
    marginTop: theme.spacing.sm,
    borderRadius: theme.radii.xl,
  },
  supportFootnote: {
    textAlign: 'center',
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
  },
}))
