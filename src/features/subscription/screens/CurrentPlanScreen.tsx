import { Feather } from '@expo/vector-icons'
import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

import Button from '@/components/Button'
import Screen from '@/components/Screen'
import { useRecipeDocumentUsageSummary } from '@/features/recipes/hooks/useRecipeDocuments'
import { useLocalRecipesList } from '@/features/recipes/hooks/useLocalRecipes'
import {
  FREE_PLAN_MAX_IMPORT_TOTAL_BYTES,
  FREE_PLAN_MAX_RECIPES,
} from '@/features/subscription/constants/limits'
import { createThemedStyles } from '@/styles/createStyles'
import { theme } from '@/styles/theme'

type CurrentPlanScreenProps = {
  accountType: 'guest' | 'free'
  onBack: () => void
  onUpgrade: () => void
  onManageExistingRecipes?: () => void
}

const premiumFeatures = [
  'Unlimited recipes',
  '5GB cloud storage',
  'Sync across devices',
  'Automatic import of your existing recipes',
  'Offline + cloud sync',
]

const freeFeatures = [
  'Up to 100 recipes',
  '50MB total storage',
  'Unlimited notes',
  'Offline access',
]

type UsageBand = 'under70' | 'between70and84' | 'between85and94' | 'between95and99' | 'atLimit'

const MEGABYTE = 1024 * 1024

function getUsageBand(percent: number): UsageBand {
  if (percent >= 100) {
    return 'atLimit'
  }
  if (percent >= 95) {
    return 'between95and99'
  }
  if (percent >= 85) {
    return 'between85and94'
  }
  if (percent >= 70) {
    return 'between70and84'
  }
  return 'under70'
}

function formatMegabytes(bytes: number) {
  return Math.max(0, Math.round(bytes / MEGABYTE))
}

function getRecipeUsageMessage(recipesSaved: number, usageBand: UsageBand) {
  const recipesRemaining = Math.max(FREE_PLAN_MAX_RECIPES - recipesSaved, 0)

  if (usageBand === 'atLimit') {
    return "You've reached the Free plan limit."
  }
  if (usageBand === 'between95and99') {
    return `${recipesRemaining} recipes remaining before you reach the Free limit.`
  }
  if (usageBand === 'between85and94') {
    return `Only ${recipesRemaining} recipes left on the Free plan.`
  }
  if (usageBand === 'between70and84') {
    return 'Getting close to your limit - no rush, just good to know.'
  }
  return 'You still have room to save recipes.'
}

function getStorageUsageMessage(totalBytesUsed: number, usageBand: UsageBand) {
  const maxStorageMb = formatMegabytes(FREE_PLAN_MAX_IMPORT_TOTAL_BYTES)
  const usedMb = formatMegabytes(totalBytesUsed)
  const remainingMb = Math.max(maxStorageMb - usedMb, 0)

  if (usageBand === 'atLimit') {
    return "You've reached the Free storage limit."
  }
  if (usageBand === 'between95and99') {
    return "You're almost at the Free storage limit."
  }
  if (usageBand === 'between85and94') {
    return `Only ${remainingMb}MB remaining.`
  }
  if (usageBand === 'between70and84') {
    return 'Storage is filling up.'
  }
  return 'You still have storage available.'
}

export default function CurrentPlanScreen({
  accountType,
  onBack,
  onUpgrade,
  onManageExistingRecipes,
}: CurrentPlanScreenProps) {
  const localRecipesQuery = useLocalRecipesList()
  const storageUsageQuery = useRecipeDocumentUsageSummary()
  const recipesSaved = localRecipesQuery.data?.length ?? 0
  const recipesUsagePercent = Math.min((recipesSaved / FREE_PLAN_MAX_RECIPES) * 100, 100)
  const recipesUsageBand = getUsageBand(recipesUsagePercent)
  const recipesUsageMessage = getRecipeUsageMessage(recipesSaved, recipesUsageBand)

  const storageBytesUsed = storageUsageQuery.data?.totalBytes ?? 0
  const storageUsagePercent = Math.min((storageBytesUsed / FREE_PLAN_MAX_IMPORT_TOTAL_BYTES) * 100, 100)
  const storageUsageBand = getUsageBand(storageUsagePercent)
  const storageUsageMessage = getStorageUsageMessage(storageBytesUsed, storageUsageBand)
  const storageMbUsed = formatMegabytes(storageBytesUsed)
  const storageMbLimit = formatMegabytes(FREE_PLAN_MAX_IMPORT_TOTAL_BYTES)

  const upgradeUsageBand = getUsageBand(Math.max(recipesUsagePercent, storageUsagePercent))
  const handleManageExistingRecipes = onManageExistingRecipes ?? onBack

  const currentPlanLabel = accountType === 'guest' ? 'Guest' : 'Free'
  const subtitle =
    accountType === 'guest'
      ? 'You are in Guest mode (Free plan).'
      : 'You are on the Free plan.'

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
          <Text style={styles.title}>Current Plan</Text>
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
          <View style={[styles.progressFill, { width: `${recipesUsagePercent}%` }]} />
        </View>

        <Text style={styles.usageMessage}>{recipesUsageMessage}</Text>

        <View style={styles.sectionDivider} />

        <View style={styles.usageHeader}>
          <Text style={styles.usageTitle}>Storage</Text>
          <Text style={styles.usageValue}>
            <Text style={styles.usageValueStrong}>{storageMbUsed}MB</Text>/{storageMbLimit}MB used
          </Text>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${storageUsagePercent}%` }]} />
        </View>

        <Text style={styles.usageMessage}>{storageUsageMessage}</Text>

        {upgradeUsageBand === 'between70and84' ? (
          <Text style={styles.inlineUpgradeHint}>
            Upgrade to Premium for unlimited recipes and cloud sync.
          </Text>
        ) : null}

        {upgradeUsageBand === 'between85and94' ? (
          <View style={styles.usagePromptWrap}>
            <Button onPress={onUpgrade} variant="ghost" size="md" style={styles.ghostCta}>
              Learn about Premium
            </Button>
          </View>
        ) : null}

        {upgradeUsageBand === 'between95and99' ? (
          <View style={styles.usagePromptWrap}>
            <Button onPress={onUpgrade} size="md" style={styles.usageUpgradeButton}>
              Upgrade to Premium
            </Button>
            <Text style={styles.upgradeMicrocopy}>
              Premium removes limits and securely backs up your library.
            </Text>
          </View>
        ) : null}

        {upgradeUsageBand === 'atLimit' ? (
          <View style={styles.usagePromptWrap}>
            <Text style={styles.limitReachedText}>You&apos;ve reached the Free plan limit.</Text>
            <Button onPress={onUpgrade} size="md" style={styles.usageUpgradeButton}>
              Upgrade to Premium
            </Button>
            <Button
              onPress={handleManageExistingRecipes}
              size="md"
              variant="secondary"
              style={styles.manageRecipesButton}
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
              <Text
                style={[
                  styles.featureText,
                  index === 0 && styles.featureTextStrong,
                ]}
              >
                {feature}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.divider} />
        <Text style={styles.premiumFootnote}>
          Designed for cooks who want their library safe and accessible everywhere.
        </Text>
      </View>

      <Button onPress={onUpgrade} style={styles.upgradeButton} textStyle={styles.upgradeButtonText}>
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
  usageUpgradeButton: {
    borderRadius: theme.radii.xl,
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
  manageRecipesButton: {
    borderRadius: theme.radii.xl,
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
    backgroundColor: theme.colors.primarySoft,
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
  upgradeButton: {
    borderRadius: theme.radii.xxl,
    paddingVertical: theme.spacing.sm,
  },
  upgradeButtonText: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.xxl,
    lineHeight: theme.lineHeight.xxl,
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
}))
