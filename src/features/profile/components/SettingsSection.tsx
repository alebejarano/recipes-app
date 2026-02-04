import React from 'react';
import { View } from 'react-native';

import { createThemedStyles } from '@/styles/createStyles';

import SectionHeader from '@/features/profile/components/SectionHeader';
import SettingsRow, { type SettingsRowItem } from '@/features/profile/components/SettingsRow';

type Props = {
  title: string;
  subtitle?: string;
  rightPillText?: string;
  items: SettingsRowItem[];
};

export default function SettingsSection({ title, subtitle, rightPillText, items }: Props) {
  return (
    <View style={styles.wrap}>
      <SectionHeader title={title} subtitle={subtitle} rightPillText={rightPillText} />
      <View style={styles.card}>
        {items.map((item, idx) => (
          <SettingsRow
            key={item.id}
            item={item}
            isLast={idx === items.length - 1}
          />
        ))}
      </View>
    </View>
  );
}

const styles = createThemedStyles((theme) => ({
  wrap: {
    marginBottom: theme.spacing.xl,
  },
  card: {
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
}));
