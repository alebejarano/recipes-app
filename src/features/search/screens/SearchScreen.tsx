import { Feather } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

import { createThemedStyles } from '@/styles/createStyles';

type FilterId = 'all' | 'recipes' | 'collections' | 'notes';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterId>('all');

  // Temporary mock data (replace with your real entities later)
  const recent = ['Quinoa', 'Chicken', 'Pasta', 'Salad'];

  const placeholder = useMemo(() => {
    switch (activeFilter) {
      case 'recipes':
        return 'Search recipes…';
      case 'collections':
        return 'Search collections…';
      case 'notes':
        return 'Search notes…';
      default:
        return 'Search anything…';
    }
  }, [activeFilter]);

  const showEmpty = query.trim().length === 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Search</Text>
      <Text style={styles.subtitle}>
        Find recipes, collections, and notes in one place.
      </Text>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Feather name="search" size={18} style={styles.searchIcon} />

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={placeholder}
          placeholderTextColor={styles.placeholder.color}
          style={styles.input}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />

        {!!query && (
          <TouchableOpacity
            onPress={() => setQuery('')}
            activeOpacity={0.8}
            style={styles.clearButton}
          >
            <Feather name="x" size={16} style={styles.clearIcon} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      <View style={styles.filtersRow}>
        <Chip
          label="All"
          isActive={activeFilter === 'all'}
          onPress={() => setActiveFilter('all')}
        />
        <Chip
          label="Recipes"
          isActive={activeFilter === 'recipes'}
          onPress={() => setActiveFilter('recipes')}
        />
        <Chip
          label="Collections"
          isActive={activeFilter === 'collections'}
          onPress={() => setActiveFilter('collections')}
        />
        <Chip
          label="Notes"
          isActive={activeFilter === 'notes'}
          onPress={() => setActiveFilter('notes')}
        />
      </View>

      {/* Content */}
      {showEmpty ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <Feather name="search" size={22} style={styles.emptyIcon} />
          </View>
          <Text style={styles.emptyTitle}>Start searching</Text>
          <Text style={styles.emptyText}>
            Try “chicken”, “quick dinner”, or “vegetarian”.
          </Text>

          <View style={styles.recentBlock}>
            <Text style={styles.sectionTitle}>Recent</Text>

            <View style={styles.recentList}>
              {recent.map((item) => (
                <TouchableOpacity
                  key={item}
                  onPress={() => setQuery(item)}
                  activeOpacity={0.85}
                  style={styles.recentItem}
                >
                  <Feather name="clock" size={16} style={styles.recentIcon} />
                  <Text style={styles.recentText}>{item}</Text>
                  <Feather
                    name="arrow-up-right"
                    size={16}
                    style={styles.recentArrow}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.resultsBlock}>
          <Text style={styles.sectionTitle}>Results</Text>

          {/* Placeholder results UI for now */}
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>No results yet</Text>
            <Text style={styles.resultText}>
              Wire this to your data layer later (recipes/collections/notes).
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

function Chip({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.chip, isActive ? styles.chipActive : styles.chipInactive]}
    >
      <Text style={[styles.chipText, isActive ? styles.chipTextActive : styles.chipTextInactive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = createThemedStyles((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
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
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
  },

  searchBar: {
    marginTop: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.radii.xl,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  searchIcon: {
    color: theme.colors.mutedForeground,
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.foreground,
    paddingVertical: 0,
  },
  placeholder: {
    color: theme.colors.mutedForeground,
  },
  clearButton: {
    width: 32,
    height: 32,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.sm,
  },
  clearIcon: {
    color: theme.colors.mutedForeground,
  },

  filtersRow: {
    marginTop: theme.spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },

  chip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.full,
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipInactive: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border,
  },
  chipText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
  },
  chipTextActive: {
    color: theme.colors.primaryForeground,
  },
  chipTextInactive: {
    color: theme.colors.foreground,
  },

  emptyState: {
    flex: 1,
    marginTop: theme.spacing.xl,
  },
  emptyIconWrap: {
    width: 48,
    height: 48,
    borderRadius: theme.radii.xl,
    backgroundColor: theme.colors.sageLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  emptyIcon: {
    color: theme.colors.sageDark,
  },
  emptyTitle: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.xl,
    lineHeight: theme.lineHeight.xl,
    color: theme.colors.foreground,
  },
  emptyText: {
    marginTop: theme.spacing.xs,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
    maxWidth: 360,
  },

  recentBlock: {
    marginTop: theme.spacing.xl,
  },
  sectionTitle: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.mutedForeground,
    marginBottom: theme.spacing.sm,
  },
  recentList: {
    gap: theme.spacing.sm,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.radii.xl,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  recentIcon: {
    color: theme.colors.mutedForeground,
    marginRight: theme.spacing.sm,
  },
  recentText: {
    flex: 1,
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.foreground,
  },
  recentArrow: {
    color: theme.colors.mutedForeground,
  },

  resultsBlock: {
    marginTop: theme.spacing.lg,
  },
  resultCard: {
    borderRadius: theme.radii.xl,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
  },
  resultTitle: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.foreground,
  },
  resultText: {
    marginTop: theme.spacing.xs,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
  },
}));
