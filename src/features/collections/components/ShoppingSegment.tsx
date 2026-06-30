import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { createThemedStyles } from '@/styles/createStyles';
import { theme } from '@/styles/theme';

import { useShoppingListStore } from '@/features/shopping-list/store/useShoppingListStore';

const HIGHLIGHTS_COUNT = 3

export default function ShoppingSegment({
  bottomPadding,
  mode = 'auth',
}: {
  bottomPadding: number
  mode?: 'auth' | 'public'
}) {
  const hydrate = useShoppingListStore((s) => s.hydrate)
  const isHydrated = useShoppingListStore((s) => s.isHydrated)
  const isHydrating = useShoppingListStore((s) => s.isHydrating)
  const items = useShoppingListStore((s) => s.items)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  const isLoading = !isHydrated || isHydrating

  const { total, checked, progress, highlights, moreCount, statusLabel } = useMemo(() => {
    const total = items.length
    const checked = items.reduce((acc, i) => acc + (i.checked ? 1 : 0), 0)
    const progress = total === 0 ? 0 : checked / total

    // highlights source: prefer unchecked items, otherwise any items
    const unchecked = items.filter((i) => !i.checked)
    const source = unchecked.length > 0 ? unchecked : items

    const highlights = source.slice(0, HIGHLIGHTS_COUNT).map((i) => i.name)
    const moreCount = Math.max(0, source.length - highlights.length)

    const statusLabel = total === 0 ? 'Empty' : 'Active'

    return { total, checked, progress, highlights, moreCount, statusLabel }
  }, [items])

  const onOpenList = () => {
    const route =
      mode === 'public'
        ? '/(public)/shopping-list'
        : '/(auth)/shopping-list'
    router.push(route)
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
    >
      <Text style={styles.helper}>Everything you need, in one list</Text>

      {/* Current List card */}
      <Pressable
        onPress={onOpenList}
        style={styles.currentCard}
        accessibilityRole="button"
        accessibilityLabel="Open current shopping list"
      >
        <View style={styles.currentTop}>
          <View style={styles.cartIconWrap}>
            <Feather name="shopping-cart" size={22} color={theme.colors.primaryDark} />
          </View>

          <View style={styles.currentMain}>
            <View style={styles.currentTitleRow}>
              <Text style={styles.currentTitle}>Current List</Text>

              <View style={styles.badge}>
                <Text style={styles.badgeText}>{statusLabel}</Text>
              </View>
            </View>

            <Text style={styles.currentSub}>
              {isLoading ? (
                <>Loading…</>
              ) : total === 0 ? (
                <>No items yet</>
              ) : (
                <>
                  {checked}/{total} items checked
                </>
              )}
            </Text>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
            </View>

            {/* Only show pills when we have items and we are not loading */}
            {!isLoading && total > 0 ? (
              <View style={styles.pillsRow}>
                {highlights.map((label) => (
                  <View key={label} style={styles.pill}>
                    <Text style={styles.pillText} numberOfLines={1}>
                      {label}
                    </Text>
                  </View>
                ))}

                {moreCount > 0 ? <Text style={styles.moreText}>+{moreCount} more</Text> : null}
              </View>
            ) : null}
          </View>

          <Feather name="chevron-right" size={22} color={theme.colors.mutedForeground} />
        </View>
      </Pressable>
    

      {/* Tip banner */}
      <View style={styles.tip}>
        <Text style={styles.tipText}>
            💡 Tip: Add ingredients from any recipe directly to your shopping list
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
    ...theme.textVariants.body,
    color: theme.colors.mutedForeground,
    maxWidth: 320,
  },

  currentCard: {
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.primarySoft,
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
    backgroundColor: theme.colors.frostedSurface,
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
    ...theme.textVariants.heading,
    color: theme.colors.foreground,
  },

  badge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
    borderRadius: 999,
    backgroundColor: 'rgba(66, 120, 88, 0.18)',
  },

  badgeText: {
    ...theme.textVariants.labelSmall,
    color: theme.colors.primaryDark,
  },

  currentSub: {
    marginTop: theme.spacing.xs,
    ...theme.textVariants.body,
    color: theme.colors.mutedForeground,
  },

  progressTrack: {
    marginTop: theme.spacing.md,
    height: 10,
    borderRadius: 999,
    backgroundColor: theme.colors.frostedSurface,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
  },

  pillsRow: {
    marginTop: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },

  pill: {
    maxWidth: 120,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: 999,
    backgroundColor: theme.colors.frostedSurface,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },

  pillText: {
    ...theme.textVariants.label,
    color: theme.colors.foreground,
  },

  moreText: {
    ...theme.textVariants.body,
    color: theme.colors.mutedForeground,
    marginLeft: theme.spacing.xs,
  },

  fromRecipeCard: {
    marginTop: theme.spacing.xl,
    borderRadius: theme.radii.lg,
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
    ...theme.textVariants.subtitle,
    color: theme.colors.foreground,
  },

  tip: {
    marginTop: theme.spacing['2xl'],
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.secondary,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },

  tipText: {
    flex: 1,
    ...theme.textVariants.body,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
  },
}))
