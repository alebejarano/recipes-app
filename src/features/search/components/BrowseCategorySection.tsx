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
  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.grid}>
        {items.map((item) => (
          <View key={item.id} style={styles.cardWrap}>
            <BrowseCategoryCard
              label={item.label}
              icon={item.icon}
              onPress={onPressItem ? () => onPressItem(item.id) : undefined}
            />
          </View>
        ))}
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: theme.spacing.lg,
    rowGap: theme.spacing.lg,
  },
  cardWrap: {
    width: '47%',
  },
}));
