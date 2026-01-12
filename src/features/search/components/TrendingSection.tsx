import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

import type { TrendingChip as TrendingChipType } from '@/features/search/data/searchMockData';
import { createThemedStyles } from '@/styles/createStyles';
import TrendingChip from './TrendingChip';

type Props = {
  title: string;
  items: TrendingChipType[];
  onPressItem?: (id: string) => void;
};

export default function TrendingSection({ title, items, onPressItem }: Props) {
  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Feather name="trending-up" size={18} style={styles.headerIcon} />
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={styles.chipsRow}>
        {items.map((item) => (
          <TrendingChip
            key={item.id}
            label={item.label}
            icon={item.icon}
            onPress={onPressItem ? () => onPressItem(item.id) : undefined}
          />
        ))}
      </View>
    </View>
  );
}

const styles = createThemedStyles((theme) => ({
  section: {
    marginTop: theme.spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  headerIcon: {
    color: theme.colors.sageDark,
  },
  title: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.xl,
    lineHeight: theme.lineHeight.xl,
    color: theme.colors.foreground,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
}));
