import React from 'react';
import { Text, View } from 'react-native';

import type { BrowseCategory } from '@/features/search/data/searchMockData';
import { createThemedStyles } from '@/styles/createStyles';
import BrowseCategoryCard from './BrowseCategoryCard';

type Props = {
  title: string;
  items: BrowseCategory[];
  onPressItem?: (id: string) => void;
};

export default function BrowseCategorySection({ title, items, onPressItem }: Props) {
  // Expecting 4 items for the 2x2 layout like your screenshot
  const [a, b, c, d] = items;

  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.grid}>
        <View style={styles.row}>
          {a && (
            <BrowseCategoryCard
              label={a.label}
              icon={a.icon}
              tone={a.tone}
              onPress={onPressItem ? () => onPressItem(a.id) : undefined}
            />
          )}
          {b && (
            <BrowseCategoryCard
              label={b.label}
              icon={b.icon}
              tone={b.tone}
              onPress={onPressItem ? () => onPressItem(b.id) : undefined}
            />
          )}
        </View>

        <View style={styles.row}>
          {c && (
            <BrowseCategoryCard
              label={c.label}
              icon={c.icon}
              tone={c.tone}
              onPress={onPressItem ? () => onPressItem(c.id) : undefined}
            />
          )}
          {d && (
            <BrowseCategoryCard
              label={d.label}
              icon={d.icon}
              tone={d.tone}
              onPress={onPressItem ? () => onPressItem(d.id) : undefined}
            />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = createThemedStyles((theme) => ({
  section: {
    marginTop: theme.spacing.xl,
  },
  title: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.xl,
    lineHeight: theme.lineHeight.xl,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.lg,
  },
  grid: {
    gap: theme.spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
  },
}));
