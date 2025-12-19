// app/(auth)/(tabs)/index.tsx
import { Feather } from '@expo/vector-icons';
import React from 'react';
import {
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '@/components/Button';
import { createThemedStyles } from '@/styles/createStyles';

type GettingStartedKey =
  | 'create_space'
  | 'import_first_recipe'
  | 'add_3_recipes'
  | 'explore_folders';

type Props = {
  showAccountSuccessBanner?: boolean; // true only right after account creation
  onAddRecipe: () => void;
  onOpenFolders: () => void;
  onSeeAllRecent?: () => void;
  onSearchPress?: () => void;
};

export default function HomeScreen({
  showAccountSuccessBanner = false,
  onAddRecipe,
  onOpenFolders,
  onSeeAllRecent,
  onSearchPress,
}: Props) {
  // Mock “Getting Started” state (wire this to your real onboarding state)
  const gettingStarted = {
    total: 4,
    completed: 2,
    items: [
      { key: 'create_space' as const, label: 'Create your space', done: true },
      {
        key: 'import_first_recipe' as const,
        label: 'Import first recipe',
        done: true,
      },
      { key: 'add_3_recipes' as const, label: 'Add 3 recipes', done: false },
      {
        key: 'explore_folders' as const,
        label: 'Explore folders',
        done: false,
      },
    ],
  };

  // Mock “recently added” state (wire to your recipes)
  const recent = {
    hasAny: true,
    first: {
      title: 'Creamy Tuscan P...',
      meta: 'Pasta • 30 min',
      badge: 'New',
    },
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Success banner (conditional) */}
        {showAccountSuccessBanner && (
          <View style={styles.successBanner}>
            <Text style={styles.successBannerText}>
              🎉 You&apos;re all set! Start adding your favorite recipes.
            </Text>
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Your Recipes</Text>
          <Text style={styles.subtitle}>
            ✨ Your recipe library is growing beautifully.
          </Text>
        </View>

        {/* Search */}
        <Pressable
          onPress={onSearchPress}
          style={styles.searchWrapper}
          accessibilityRole="button"
        >
          <Feather name="search" size={18} style={styles.searchIcon} />
          <TextInput
            placeholder="Search recipes..."
            placeholderTextColor={styles.searchPlaceholder.color}
            style={styles.searchInput}
            editable={false} // tap triggers onSearchPress
          />
        </Pressable>

        {/* Getting Started card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Getting Started</Text>
            <Text style={styles.cardProgress}>
              {gettingStarted.completed}/{gettingStarted.total}
            </Text>
          </View>

          <View style={styles.checklist}>
            {gettingStarted.items.map((item) => (
              <GettingStartedRow key={item.key} label={item.label} done={item.done} />
            ))}
          </View>
        </View>

        {/* Primary actions */}
        <View style={styles.actions}>
          <Button
            variant="primary"
            size="xl"
            onPress={onAddRecipe}
            icon={<Feather name="plus" size={20} color={styles.primaryIcon.color} />}
          >
            Add Recipe
          </Button>

          <View style={styles.actionSpacer} />

          <Button
            variant="soft"
            size="xl"
            onPress={onOpenFolders}
            icon={<Feather name="folder" size={20} color={styles.softIcon.color} />}
          >
            Folders
          </Button>
        </View>

        {/* Recently Added */}
        <View style={styles.recentHeaderRow}>
          <Text style={styles.sectionTitle}>Recently Added</Text>
          <Pressable
            onPress={onSeeAllRecent}
            style={styles.seeAllBtn}
            accessibilityRole="button"
          >
            <Text style={styles.seeAllText}>See All</Text>
          </Pressable>
        </View>

        {recent.hasAny ? (
          <View style={styles.recentCard}>
            <View style={styles.recentThumb}>
              {/* placeholder illustration area */}
              <Text style={styles.recentThumbEmoji}>🍝</Text>
            </View>

            <View style={styles.recentInfo}>
              <Text style={styles.recentTitle} numberOfLines={1}>
                {recent.first.title}
              </Text>
              <Text style={styles.recentMeta} numberOfLines={1}>
                {recent.first.meta}
              </Text>
            </View>

            <View style={styles.recentBadge}>
              <Text style={styles.recentBadgeText}>{recent.first.badge}</Text>
            </View>
          </View>
        ) : null}

        {/* Empty state dashed box */}
        <View style={styles.emptyBox}>
          <Feather name="coffee" size={34} style={styles.emptyIcon} />
          <Text style={styles.emptyText}>Add more recipes to see them here</Text>
        </View>

        {/* Bottom spacing so it breathes above tab bar */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

function GettingStartedRow({ label, done }: { label: string; done: boolean }) {
  return (
    <View style={styles.row}>
      <View style={[styles.rowIconWrap, done ? styles.rowIconWrapDone : styles.rowIconWrapTodo]}>
        {done ? (
          <Feather name="check" size={16} color={styles.rowCheck.color} />
        ) : null}
      </View>

      <Text style={[styles.rowLabel, done ? styles.rowLabelDone : undefined]}>
        {label}
      </Text>
    </View>
  );
}

const styles = createThemedStyles((theme) => ({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },

  /* Success banner */
  successBanner: {
    width: '100%',
    backgroundColor: theme.colors.sageLight,
    borderRadius: theme.radii.xxl,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  successBannerText: {
    textAlign: 'center',
    color: theme.colors.sageDark,
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
  },

  /* Header */
  header: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.hero,
    lineHeight: theme.lineHeight.hero,
    color: theme.colors.foreground,
  },
  subtitle: {
    marginTop: theme.spacing.xs,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
  },

  /* Search */
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.muted,
    borderRadius: theme.radii.xxl,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  searchIcon: {
    color: theme.colors.mutedForeground,
    marginRight: theme.spacing.md,
  },
  searchInput: {
    flex: 1,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.foreground,
  },
  searchPlaceholder: {
    color: theme.colors.mutedForeground,
  },

  /* Card */
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.xxl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.foreground,
  },
  cardProgress: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
  },

  /* Checklist */
  checklist: {
    gap: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  rowIconWrap: {
    width: 28,
    height: 28,
    borderRadius: theme.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  rowIconWrapDone: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  rowIconWrapTodo: {
    backgroundColor: 'transparent',
    borderColor: theme.colors.border,
  },
  rowCheck: {
    color: theme.colors.primaryForeground,
  },
  rowLabel: {
    flex: 1,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.foreground,
  },
  rowLabelDone: {
    color: theme.colors.mutedForeground,
    textDecorationLine: 'line-through',
  },

  /* Actions */
  actions: {
    marginBottom: theme.spacing.lg,
  },
  actionSpacer: {
    height: theme.spacing.md,
  },
  primaryIcon: {
    color: theme.colors.primaryForeground,
  },
  softIcon: {
    color: theme.colors.foreground,
  },

  /* Recently Added */
  recentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.xxl,
    lineHeight: theme.lineHeight.xxl,
    color: theme.colors.foreground,
  },
  seeAllBtn: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  seeAllText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.primary,
  },

  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.xxl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  recentThumb: {
    width: 56,
    height: 56,
    borderRadius: theme.radii.xl,
    backgroundColor: theme.colors.terracottaLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentThumbEmoji: {
    fontSize: 22,
  },
  recentInfo: {
    flex: 1,
  },
  recentTitle: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.foreground,
  },
  recentMeta: {
    marginTop: 2,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
  },
  recentBadge: {
    backgroundColor: theme.colors.sageLight,
    borderRadius: theme.radii.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  recentBadgeText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.sageDark,
  },

  /* Empty dashed box */
  emptyBox: {
    borderRadius: theme.radii.xxl,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    backgroundColor: theme.colors.muted,
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    color: theme.colors.mutedForeground,
    marginBottom: theme.spacing.md,
  },
  emptyText: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
  },

  bottomSpacer: {
    height: theme.spacing.xl,
  },
}));
