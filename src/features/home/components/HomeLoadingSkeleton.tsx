import React from 'react';
import { View } from 'react-native';

import { createThemedStyles } from '@/styles/createStyles';
import { layout } from '@/styles/layout';

type Props = {
  cardWidth: number;
  label: string;
};

export default function HomeLoadingSkeleton({ cardWidth, label }: Props) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      style={styles.container}
      testID="home-loading-skeleton"
    >
      <View style={styles.header}>
        <View style={[styles.placeholder, styles.greeting]} />
        <View style={[styles.placeholder, styles.title]} />
      </View>

      <View style={styles.featureCard}>
        <View style={[styles.placeholder, styles.featureIcon]} />
        <View style={styles.featureText}>
          <View style={[styles.placeholder, styles.featureLabel]} />
          <View style={[styles.placeholder, styles.featureTitle]} />
          <View style={[styles.placeholder, styles.featureSubtitle]} />
        </View>
      </View>

      <View style={styles.recipeSection}>
        <View style={[styles.placeholder, styles.sectionTitle]} />
        <View style={styles.recipeRow}>
          {[0, 1].map((index) => (
            <View key={index} style={[styles.recipeCard, { width: cardWidth }]}>
              <View style={[styles.placeholder, styles.recipeImage]} />
              <View style={[styles.placeholder, styles.recipeTitle]} />
              <View style={[styles.placeholder, styles.recipeMeta]} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = createThemedStyles((theme) => ({
  container: {
    gap: layout.sectionGap,
  },
  placeholder: {
    backgroundColor: theme.colors.muted,
  },
  header: {
    marginTop: theme.spacing['2xl'],
    gap: theme.spacing.sm,
  },
  greeting: {
    width: '32%',
    height: theme.lineHeight.base,
    borderRadius: theme.radii.sm,
  },
  title: {
    width: '64%',
    height: theme.lineHeight.hero,
    borderRadius: theme.radii.sm,
  },
  featureCard: {
    minHeight: 96,
    padding: layout.cardPadding,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.primary10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.cardGap,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: theme.radii.lg,
  },
  featureText: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  featureLabel: {
    width: '28%',
    height: 12,
    borderRadius: theme.radii.sm,
  },
  featureTitle: {
    width: '64%',
    height: theme.lineHeight.base,
    borderRadius: theme.radii.sm,
  },
  featureSubtitle: {
    width: '84%',
    height: 12,
    borderRadius: theme.radii.sm,
  },
  recipeSection: {
    gap: layout.cardGap,
  },
  sectionTitle: {
    width: '42%',
    height: theme.lineHeight.base,
    borderRadius: theme.radii.sm,
  },
  recipeRow: {
    flexDirection: 'row',
    gap: layout.cardGap,
    overflow: 'hidden',
  },
  recipeCard: {
    minHeight: 156,
    padding: layout.cardPadding,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.cream,
    gap: theme.spacing.md,
  },
  recipeImage: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.md,
  },
  recipeTitle: {
    width: '80%',
    height: theme.lineHeight.base,
    borderRadius: theme.radii.sm,
  },
  recipeMeta: {
    width: '48%',
    height: 12,
    borderRadius: theme.radii.sm,
  },
}));
