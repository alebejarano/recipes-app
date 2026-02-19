import { Feather } from '@expo/vector-icons'
import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

import Button from '@/components/Button'
import Screen from '@/components/Screen'
import { useLocalRecipesList } from '@/features/recipes/hooks/useLocalRecipes'
import { FREE_PLAN_MAX_RECIPES } from '@/features/subscription/constants/limits'
import { createThemedStyles } from '@/styles/createStyles'
import { theme } from '@/styles/theme'

type CurrentPlanScreenProps = {
  accountType: 'guest' | 'free'
  onBack: () => void
  onUpgrade: () => void
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

function getUsageMessage(recipesSaved: number) {
  if (recipesSaved >= FREE_PLAN_MAX_RECIPES) {
    return 'You reached the free limit. Upgrade anytime when you are ready.'
  }
  if (recipesSaved >= FREE_PLAN_MAX_RECIPES * 0.7) {
    return 'Getting close to your limit - no rush, just good to know.'
  }
  return 'You still have room to keep saving recipes on this device.'
}

export default function CurrentPlanScreen({
  accountType,
  onBack,
  onUpgrade,
}: CurrentPlanScreenProps) {
  const localRecipesQuery = useLocalRecipesList()
  const recipesSaved = localRecipesQuery.data?.length ?? 0
  const usagePercent = Math.min((recipesSaved / FREE_PLAN_MAX_RECIPES) * 100, 100)
  const usageMessage = getUsageMessage(recipesSaved)
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
          <View style={[styles.progressFill, { width: `${usagePercent}%` }]} />
        </View>

        <Text style={styles.usageMessage}>{usageMessage}</Text>
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
  usageMessage: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.mutedForeground,
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
