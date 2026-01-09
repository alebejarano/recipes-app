// app/(dev)/(tabs)/index.tsx

import { getTransitionalHomeMocks, type HomeMocks } from '@/__mocks__/home'
import { createThemedStyles } from '@/styles/createStyles'
import { theme } from '@/styles/theme'
import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useMemo, useState } from 'react'
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native'

type MealTime = 'breakfast' | 'lunch' | 'snack' | 'dinner'

type HomeProps = {
  showAccountSuccessBanner?: boolean // true only right after account creation
}

function getMealTime(now: Date): MealTime {
  const h = now.getHours()
  if (h >= 5 && h < 11) return 'breakfast'
  if (h >= 11 && h < 15) return 'lunch'
  if (h >= 15 && h < 19) return 'snack'
  return 'dinner'
}

function getPickLabel(meal: MealTime) {
  switch (meal) {
    case 'breakfast':
      return 'Breakfast pick'
    case 'lunch':
      return 'Lunch pick'
    case 'snack':
      return 'Snack pick'
    case 'dinner':
      return 'Dinner pick'
  }
}

function formatRelativeDay(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const diffDays = Math.floor((+now - +d) / (1000 * 60 * 60 * 24))
  if (diffDays <= 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  return `${diffDays} days ago`
}

function sortMostRecent<T extends { updatedAt?: string; createdAt?: string }>(
  items: T[]
) {
  return [...items].sort((a, b) => {
    const at = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime()
    const bt = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime()
    return bt - at
  })
}

/**
 * Replace with your store/query.
 * Keep the shapes; the UI is designed around them.
 */
function useHomeDataMock(): HomeMocks {
  return getTransitionalHomeMocks()
}

export default function HomeScreen({ showAccountSuccessBanner }: HomeProps) {
  const { width: screenWidth } = useWindowDimensions()

  // Card peek math (tablet-safe)
  const PAGE_PADDING = theme.spacing.xl // must match styles.content.paddingHorizontal
  const CARD_GAP = theme.spacing.md
  const PEEK = 16

  const MIN_CARD_WIDTH = 150
  const MAX_CARD_WIDTH = 340

  const recipeCardWidth = useMemo(() => {
    const availableWidth = screenWidth - 2 * PAGE_PADDING
    const ideal = availableWidth - CARD_GAP - PEEK
    const clamped = Math.min(Math.max(ideal, MIN_CARD_WIDTH), MAX_CARD_WIDTH)
    return Math.floor(clamped)
  }, [screenWidth])

  const { recipes, notes, lastViewedRecipe, shoppingList } = useHomeDataMock()
  const [bannerDismissed, setBannerDismissed] = useState(false)

  const totalItems = recipes.length + notes.length
  const isEmpty = totalItems <= 1
  const isTransitional = totalItems >= 2 && totalItems <= 4
  const isMature = totalItems >= 5

  // Shopping list visibility (data-driven)
  const shoppingListVisible = (shoppingList?.totalCount ?? 0) > 0

  // ✅ Fix: narrow once, then only reference the narrowed variable in render
  const activeShoppingList = shoppingListVisible ? shoppingList : null

  // Hard rule: If Shopping List is visible, “Dinner tonight” becomes hidden.
  const dinnerTonightVisible = !shoppingListVisible && !isEmpty

  // Time-based pick card: only when enough recipes
  const PICK_MIN_RECIPES = 5
  const pick = useMemo(() => {
    if (isEmpty) return null
    if (recipes.length < PICK_MIN_RECIPES) return null

    const meal = getMealTime(new Date())
    const candidates = recipes.filter((r) => (r.mealTimes ?? []).includes(meal))
    const pool = candidates.length ? candidates : recipes
    const recipe = sortMostRecent(pool)[0] ?? null

    return recipe
      ? {
          recipe,
          label: getPickLabel(meal),
        }
      : null
  }, [isEmpty, recipes])

  const recentRecipes = useMemo(
    () => sortMostRecent(recipes).slice(0, isTransitional ? 2 : 6),
    [recipes, isTransitional]
  )
  const recentNotes = useMemo(() => sortMostRecent(notes).slice(0, 1), [notes])
  const firstRecentNote = recentNotes[0]

  const greeting = useMemo(() => {
    const meal = getMealTime(new Date())
    if (meal === 'breakfast') return 'Good morning'
    if (meal === 'lunch') return 'Good afternoon'
    if (meal === 'snack') return 'Good afternoon'
    return 'Good evening'
  }, [])

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Success banner */}
        {showAccountSuccessBanner && !bannerDismissed ? (
          <View style={styles.banner}>
            <Text style={styles.bannerSparkle}>✨</Text>
            <Text style={styles.bannerText}>
              You're all set! Your recipes are safe.
            </Text>

            <Pressable
              onPress={() => setBannerDismissed(true)}
              style={styles.bannerClose}
              accessibilityRole="button"
              accessibilityLabel="Dismiss"
              hitSlop={12}
            >
              <Feather
                name="x"
                size={18}
                color={theme.colors.mutedForeground}
              />
            </Pressable>
          </View>
        ) : null}

        {/* Header */}
        <View style={styles.headerBlock}>
          <Text style={styles.greeting}>{greeting}</Text>

          <View style={styles.titleRow}>
            <Text style={styles.title}>
              What's cooking? <Text style={styles.wave}>👋</Text>
            </Text>

            <Pressable
              onPress={() => router.push('/(dev)/(tabs)/add-recipe')}
              style={styles.fab}
              accessibilityRole="button"
              accessibilityLabel="Add recipe"
            >
              <Feather
                name="plus"
                size={26}
                color={theme.colors.primaryForeground}
              />
            </Pressable>
          </View>
        </View>

        {/* Empty state */}
        {isEmpty ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Your recipe space is ready.</Text>
            <Text style={styles.emptyBody}>
              Add a recipe or a note. Home will show recent activity and quick
              access once you do.
            </Text>

            <View style={styles.emptyActions}>
              <Pressable
                onPress={() => router.push('/(dev)/(tabs)/add-recipe')}
                style={styles.primaryButton}
                accessibilityRole="button"
              >
                <Text style={styles.primaryButtonText}>
                  Add your first recipe
                </Text>
              </Pressable>

              <Pressable
                onPress={() => router.push('/(dev)/(tabs)/collections')}
                style={styles.secondaryButton}
                accessibilityRole="button"
              >
                <Text style={styles.secondaryButtonText}>Create a note</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {/* Time-based pick */}
        {pick ? (
          <Pressable
            style={styles.pickCard}
            accessibilityRole="button"
            accessibilityLabel={`Open ${pick.recipe.title}`}
          >
            <View style={styles.pickLeft}>
              <View style={styles.pickIconCircle}>
                <Text style={styles.pickEmoji}>{pick.recipe.emoji ?? '🥗'}</Text>
              </View>

              <View style={styles.pickTextBlock}>
                <Text style={styles.pickLabel}>{pick.label}</Text>
                <Text style={styles.pickTitle} numberOfLines={1}>
                  {pick.recipe.title}
                </Text>
                <Text style={styles.pickSubtitle} numberOfLines={1}>
                  {pick.recipe.subtitle ?? 'Light & satisfying'}
                </Text>
              </View>
            </View>

            <Feather
              name="chevron-right"
              size={22}
              color={theme.colors.mutedForeground}
            />
          </Pressable>
        ) : null}

        {/* Recent Activity */}
        {!isEmpty ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionSubtitle}>Recently added recipes</Text>

              <Pressable
                onPress={() => router.push('/(dev)/(tabs)/collections')}
                style={styles.seeAll}
                accessibilityRole="button"
                accessibilityLabel="See all recipes"
              >
                <Text style={styles.seeAllText}>See all</Text>
                <Feather
                  name="chevron-right"
                  size={18}
                  color={theme.colors.primary}
                />
              </Pressable>
            </View>

            {/* Horizontal recipe cards */}
            {recentRecipes.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.hScroll}
                snapToInterval={recipeCardWidth + CARD_GAP}
                snapToAlignment="start"
                decelerationRate="fast"
              >
                <View style={[styles.hRow, { columnGap: CARD_GAP }]}>
                  {recentRecipes.map((r) => (
                    <Pressable
                      key={r.id}
                      style={[styles.recipeMiniCard, { width: recipeCardWidth }]}
                      accessibilityRole="button"
                      accessibilityLabel={`Open ${r.title}`}
                    >
                      <View style={styles.recipeMiniIconWrap}>
                        <Text style={styles.recipeMiniEmoji}>
                          {r.emoji ?? '🍋'}
                        </Text>
                      </View>

                      <Text style={styles.recipeMiniTitle} numberOfLines={2}>
                        {r.title}
                      </Text>
                      <Text style={styles.recipeMiniMeta} numberOfLines={1}>
                        {formatRelativeDay(r.createdAt ?? r.updatedAt)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            ) : (
              <View style={styles.mutedRow}>
                <Text style={styles.mutedRowText}>No recipes yet.</Text>
              </View>
            )}
          </View>
        ) : null}

        {/* Recently edited notes */}
        {!isEmpty && firstRecentNote ? (
          <View style={styles.notesStrip}>
            <View style={styles.notesStripHeader}>
              <Feather
                name="file-text"
                size={18}
                color={theme.colors.mutedForeground}
              />
              <Text style={styles.notesStripTitle}>Recently edited notes</Text>
            </View>

            <Pressable
              style={styles.notePill}
              accessibilityRole="button"
              accessibilityLabel={`Open note ${firstRecentNote.title}`}
            >
              <Text style={styles.notePillTitle} numberOfLines={1}>
                {firstRecentNote.title}
              </Text>
              <Text style={styles.notePillMeta} numberOfLines={1}>
                {formatRelativeDay(firstRecentNote.updatedAt)}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {/* Continue + quick access */}
        {!isEmpty ? (
          <View style={styles.section}>
            <Text style={styles.sectionSubtitleLarge}>
              Continue where you left off
            </Text>

            {lastViewedRecipe ? (
              <Pressable style={styles.longCard} accessibilityRole="button">
                <View style={styles.longCardLeft}>
                  <View style={styles.longIconCircle}>
                    <Text style={styles.longEmoji}>
                      {lastViewedRecipe.emoji ?? '🍋'}
                    </Text>
                  </View>

                  <View style={styles.longTextBlock}>
                    <Text style={styles.longKicker}>Last viewed</Text>
                    <Text style={styles.longTitle} numberOfLines={1}>
                      {lastViewedRecipe.title}
                    </Text>
                  </View>
                </View>

                <Feather
                  name="chevron-right"
                  size={22}
                  color={theme.colors.mutedForeground}
                />
              </Pressable>
            ) : null}

            {/* Shopping List (prominent) */}
            {activeShoppingList ? (
              <Pressable
                style={[styles.longCard, styles.shoppingCard]}
                accessibilityRole="button"
                accessibilityLabel="Open shopping list"
              >
                <View style={styles.longCardLeft}>
                  <View style={[styles.longIconCircle, styles.shoppingIconCircle]}>
                    <Feather
                      name="shopping-cart"
                      size={18}
                      color={theme.colors.mutedForeground}
                    />
                  </View>

                  <View style={styles.longTextBlock}>
                    <Text style={styles.longTitle} numberOfLines={1}>
                      Shopping List
                    </Text>
                    <Text style={styles.longMeta} numberOfLines={1}>
                      {activeShoppingList.checkedCount}/
                      {activeShoppingList.totalCount} items checked
                    </Text>
                  </View>
                </View>

                <Feather
                  name="chevron-right"
                  size={22}
                  color={theme.colors.mutedForeground}
                />
              </Pressable>
            ) : null}

            {/* Dinner tonight (hidden if shopping list visible) */}
            {dinnerTonightVisible ? (
              <Pressable
                style={styles.longCard}
                accessibilityRole="button"
                accessibilityLabel="Open Dinner tonight"
              >
                <View style={styles.longCardLeft}>
                  <View style={styles.longIconCircle}>
                    <Feather
                      name="star"
                      size={18}
                      color={theme.colors.mutedForeground}
                    />
                  </View>

                  <View style={styles.longTextBlock}>
                    <Text style={styles.longTitle} numberOfLines={1}>
                      Dinner tonight
                    </Text>
                    <Text style={styles.longMeta} numberOfLines={1}>
                      Get inspired
                    </Text>
                  </View>
                </View>

                <Feather
                  name="chevron-right"
                  size={22}
                  color={theme.colors.mutedForeground}
                />
              </Pressable>
            ) : null}

            {/* Anti-inflammatory (mature only) */}
            {isMature ? (
              <Pressable
                style={styles.antiCard}
                accessibilityRole="button"
                accessibilityLabel="Open Anti-inflammatory collection"
              >
                <View style={styles.antiHeader}>
                  <View style={styles.longCardLeft}>
                    <View style={styles.longIconCircle}>
                      <Feather
                        name="book-open"
                        size={18}
                        color={theme.colors.mutedForeground}
                      />
                    </View>

                    <View style={styles.longTextBlock}>
                      <Text style={styles.longTitle}>Anti-inflammatory</Text>
                      <Text style={styles.longMeta}>6 recipes</Text>
                    </View>
                  </View>

                  <Feather
                    name="chevron-right"
                    size={22}
                    color={theme.colors.mutedForeground}
                  />
                </View>

                <View style={styles.chipsRow}>
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>🍲 Turmeric Soup</Text>
                  </View>
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>🫐 Berry Smoothie</Text>
                  </View>
                </View>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  )
}

/* -------------------------------- Styles -------------------------------- */

const styles = createThemedStyles((theme) => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  content: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
  },

  /* Banner */
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.muted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.xl,
  },
  bannerSparkle: {
    fontSize: 16,
  },
  bannerText: {
    flex: 1,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    fontFamily: theme.fontFamily.medium,
    color: theme.colors.foreground,
  },
  bannerClose: {
    width: 34,
    height: 34,
    borderRadius: theme.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Header */
  headerBlock: {
    marginTop: theme.spacing['4xl'],
    marginBottom: theme.spacing.lg,
  },
  greeting: {
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.mutedForeground,
    marginBottom: theme.spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  title: {
    flex: 1,
    fontSize: theme.fontSize.hero,
    lineHeight: theme.lineHeight.hero,
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.foreground,
  },
  wave: {
    fontSize: theme.fontSize.hero,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.soft,
  },

  /* Empty */
  emptyCard: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.xl,
    borderRadius: theme.radii.xl,
    backgroundColor: theme.colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    ...theme.shadows.soft,
  },
  emptyTitle: {
    fontSize: theme.fontSize.xl,
    lineHeight: theme.lineHeight.xl,
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.foreground,
  },
  emptyBody: {
    marginTop: theme.spacing.sm,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.mutedForeground,
  },
  emptyActions: {
    marginTop: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  primaryButton: {
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radii.xl,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    fontFamily: theme.fontFamily.semibold,
    color: theme.colors.primaryForeground,
  },
  secondaryButton: {
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radii.xl,
    backgroundColor: theme.colors.secondary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    fontFamily: theme.fontFamily.semibold,
    color: theme.colors.secondaryForeground,
  },

  /* Pick card */
  pickCard: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.radii.xl,
    backgroundColor: theme.colors.muted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
  },
  pickIconCircle: {
    width: 56,
    height: 56,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  pickEmoji: {
    fontSize: 22,
  },
  pickTextBlock: {
    flex: 1,
  },
  pickLabel: {
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    fontFamily: theme.fontFamily.medium,
    color: theme.colors.primary,
    marginBottom: 2,
  },
  pickTitle: {
    fontSize: theme.fontSize.xl,
    lineHeight: theme.lineHeight.xl,
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.foreground,
  },
  pickSubtitle: {
    marginTop: 4,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.mutedForeground,
  },

  /* Sections */
  section: {
    marginTop: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.fontSize.xl,
    lineHeight: theme.lineHeight.xl,
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.md,
  },
  sectionSubtitle: {
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.mutedForeground,
  },
  sectionSubtitleLarge: {
    fontSize: theme.fontSize.xl,
    lineHeight: theme.lineHeight.xl,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: theme.radii.full,
  },
  seeAllText: {
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    fontFamily: theme.fontFamily.medium,
    color: theme.colors.primary,
  },

  /* Horizontal recipe cards */
  hScroll: {
    paddingRight: theme.spacing.xl,
  },
  hRow: {
    flexDirection: 'row',
  },
  recipeMiniCard: {
    padding: theme.spacing.lg,
    borderRadius: theme.radii.xl,
    backgroundColor: theme.colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    ...theme.shadows.soft,
  },
  recipeMiniIconWrap: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  recipeMiniEmoji: {
    fontSize: 20,
  },
  recipeMiniTitle: {
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    fontFamily: theme.fontFamily.semibold,
    color: theme.colors.foreground,
  },
  recipeMiniMeta: {
    marginTop: theme.spacing.sm,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.mutedForeground,
  },

  /* Notes strip */
  notesStrip: {
    marginTop: theme.spacing.xl,
  },
  notesStripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  notesStripTitle: {
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.mutedForeground,
  },
  notePill: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radii.xl,
    backgroundColor: theme.colors.muted,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  notePillTitle: {
    flex: 1,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    fontFamily: theme.fontFamily.medium,
    color: theme.colors.foreground,
  },
  notePillMeta: {
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.mutedForeground,
  },

  /* Long cards */
  longCard: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.radii.xl,
    backgroundColor: theme.colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  longCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
  },
  longIconCircle: {
    width: 52,
    height: 52,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  longEmoji: {
    fontSize: 20,
  },
  longTextBlock: {
    flex: 1,
  },
  longKicker: {
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.mutedForeground,
    marginBottom: 2,
  },
  longTitle: {
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    fontFamily: theme.fontFamily.semibold,
    color: theme.colors.foreground,
  },
  longMeta: {
    marginTop: 2,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.secondaryForeground,
  },

  /* Shopping highlight */
  shoppingCard: {
    backgroundColor: theme.colors.terracottaLight,
    borderColor: theme.colors.border,
  },
  shoppingIconCircle: {
    backgroundColor: theme.colors.card,
  },

  /* Anti-inflammatory */
  antiCard: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.radii.xl,
    backgroundColor: theme.colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  antiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  chip: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    fontFamily: theme.fontFamily.medium,
    color: theme.colors.foreground,
  },

  mutedRow: {
    padding: theme.spacing.md,
    borderRadius: theme.radii.xl,
    backgroundColor: theme.colors.muted,
  },
  mutedRowText: {
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.mutedForeground,
  },

  bottomSpacer: {
    height: Platform.select({ ios: 28, android: 20 }),
  },
}))
