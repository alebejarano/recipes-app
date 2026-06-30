import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { createThemedStyles } from '@/styles/createStyles';
import { layout } from '@/styles/layout';
import { theme } from '@/styles/theme';

type Props = {
  title: string;
  meta: string;
  chips: string[];
  onPress?: () => void;
};

export default function CollectionCard({ title, meta, chips, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={styles.card} accessibilityRole="button">
      <View style={styles.header}>
        <View style={styles.left}>
          <View style={styles.iconCircle}>
            <Feather name="book-open" size={18} color={theme.colors.mutedForeground} />
          </View>

          <View style={styles.textBlock}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.meta}>{meta}</Text>
          </View>
        </View>

        <Feather name="chevron-right" size={22} color={theme.colors.mutedForeground} />
      </View>

      <View style={styles.chipsRow}>
        {chips.slice(0, 2).map((c) => (
          <View key={c} style={styles.chip}>
            <Text style={styles.chipText} numberOfLines={1}>
              {c}
            </Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

const styles = createThemedStyles((theme) => ({
  card: {
    marginTop: theme.spacing.md,
    padding: layout.cardPadding,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.cardGap,
    flex: 1,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: { flex: 1 },
  title: {
    ...theme.textVariants.subtitle,
    color: theme.colors.foreground,
  },
  meta: {
    marginTop: 2,
    ...theme.textVariants.body,
    color: theme.colors.mutedForeground,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: layout.listGap,
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
    ...theme.textVariants.labelSmall,
    color: theme.colors.foreground,
  },
}));
