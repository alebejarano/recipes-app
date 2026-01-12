import React from 'react';
import { View } from 'react-native';

import RecentRow from '@/features/search/components/RecentRow';
import SectionHeader from '@/features/search/components/SectionHeader';
import { createThemedStyles } from '@/styles/createStyles';

type Props = {
  items: string[];
  onPick: (value: string) => void;
  onClearAll: () => void;
};

export default function RecentSection({ items, onPick, onClearAll }: Props) {
  if (items.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <SectionHeader icon="clock" title="Recent" rightLabel="Clear all" onRightPress={onClearAll} />

      <View style={styles.list}>
        {items.map((label) => (
          <RecentRow key={label} label={label} onPress={() => onPick(label)} />
        ))}
      </View>
    </View>
  );
}

const styles = createThemedStyles(theme => ({
  wrap: {
    width: '100%',
  },
  list: {
    marginTop: theme.spacing.lg,
    gap: theme.spacing.md,
  },
}));
