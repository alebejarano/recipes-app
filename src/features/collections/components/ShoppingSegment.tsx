import { Feather } from '@expo/vector-icons'
import React from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'

import { createThemedStyles } from '@/styles/createStyles'
import { theme } from '@/styles/theme'

type ShoppingList = {
  title: string
  statusLabel: string
  checked: number
  total: number
  highlights: string[]
  moreCount: number
}

const MOCK_SHOPPING: ShoppingList = {
  title: 'Current List',
  statusLabel: 'Active',
  checked: 5,
  total: 12,
  highlights: ['Olive oil', 'Chicken breast', 'Lemons'],
  moreCount: 9,
}

export default function ShoppingSegment({ bottomPadding }: { bottomPadding: number }) {
  const progress = MOCK_SHOPPING.total === 0 ? 0 : MOCK_SHOPPING.checked / MOCK_SHOPPING.total

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
    >
      <Text style={styles.helper}>Your kitchen notes and ideas</Text>

      {/* Current List card */}
      <Pressable
        onPress={() => {}}
        style={styles.currentCard}
        accessibilityRole="button"
        accessibilityLabel="Open current shopping list"
      >
        <View style={styles.currentTop}>
          <View style={styles.cartIconWrap}>
            <Feather name="shopping-cart" size={22} color={theme.colors.sageDark} />
          </View>

          <View style={styles.currentMain}>
            <View style={styles.currentTitleRow}>
              <Text style={styles.currentTitle}>{MOCK_SHOPPING.title}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{MOCK_SHOPPING.statusLabel}</Text>
              </View>
            </View>

            <Text style={styles.currentSub}>
              {MOCK_SHOPPING.checked}/{MOCK_SHOPPING.total} items checked
            </Text>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
            </View>

            <View style={styles.pillsRow}>
              {MOCK_SHOPPING.highlights.map((label) => (
                <View key={label} style={styles.pill}>
                  <Text style={styles.pillText}>{label}</Text>
                </View>
              ))}

              <Text style={styles.moreText}>+{MOCK_SHOPPING.moreCount} more</Text>
            </View>
          </View>

          <Feather name="chevron-right" size={22} color={theme.colors.mutedForeground} />
        </View>
      </Pressable>

      {/* From Recipe tile */}
      <Pressable
        onPress={() => {}}
        style={styles.fromRecipeCard}
        accessibilityRole="button"
        accessibilityLabel="Create shopping list from recipe"
      >
        <View style={styles.fromRecipeIconWrap}>
          <Feather name="image" size={18} color={theme.colors.mutedForeground} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.fromRecipeTitle}>From Recipe</Text>
          <Text style={styles.fromRecipeSub}>Auto-generate</Text>
        </View>
      </Pressable>

      {/* Tip banner */}
      <View style={styles.tip}>
        <Feather name="info" size={16} color={theme.colors.mutedForeground} />
        <Text style={styles.tipText}>
          Tip: Add ingredients from any recipe directly to your shopping list
        </Text>
      </View>
    </ScrollView>
  )
}

const styles = createThemedStyles((theme) => ({
  content: {
    paddingTop: 0,
  },

  helper: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
    maxWidth: 320,
  },

  currentCard: {
    borderRadius: theme.radii.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.sageLight,
    padding: theme.spacing.lg,
    ...theme.shadows.soft,
  },

  currentTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },

  cartIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  currentMain: { flex: 1 },

  currentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },

  currentTitle: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.xl,
    lineHeight: theme.lineHeight.xl,
    color: theme.colors.foreground,
  },

  badge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
    borderRadius: 999,
    backgroundColor: 'rgba(66, 120, 88, 0.18)',
  },

  badgeText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.sageDark,
  },

  currentSub: {
    marginTop: theme.spacing.xs,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
  },

  progressTrack: {
    marginTop: theme.spacing.md,
    height: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.65)',
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: theme.colors.sage,
  },

  pillsRow: {
    marginTop: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },

  pill: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },

  pillText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.foreground,
  },

  moreText: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
    marginLeft: theme.spacing.xs,
  },

  fromRecipeCard: {
    marginTop: theme.spacing.xl,
    borderRadius: theme.radii.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    ...theme.shadows.soft,
    width: 190,
  },

  fromRecipeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: theme.colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  fromRecipeTitle: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.foreground,
  },

  fromRecipeSub: {
    marginTop: theme.spacing.xs,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
  },

  tip: {
    marginTop: theme.spacing['2xl'],
    borderRadius: theme.radii.xl,
    backgroundColor: theme.colors.secondary,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },

  tipText: {
    flex: 1,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
  },
}))
