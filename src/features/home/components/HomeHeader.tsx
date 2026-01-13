import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { createThemedStyles } from '@/styles/createStyles';
import { theme } from '@/styles/theme';

type Props = {
  greeting: string;
  title: React.ReactNode;
  onPressAdd: () => void;
};

export default function HomeHeader({ greeting, title, onPressAdd }: Props) {
  return (
    <View style={styles.header}>
      <Text style={styles.greeting}>{greeting}</Text>

      <View style={styles.row}>
        <Text style={styles.title}>{title}</Text>

        <Pressable
          onPress={onPressAdd}
          style={styles.fab}
          accessibilityRole="button"
          accessibilityLabel="Add recipe"
        >
          <Feather name="plus" size={26} color={theme.colors.primaryForeground} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = createThemedStyles((theme) => ({
  header: {
    marginTop: theme.spacing['2xl'],
  },
  greeting: {
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.mutedForeground,
    marginBottom: theme.spacing.xs,
  },
  row: {
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
  fab: {
    width: 56,
    height: 56,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.soft,
  },
}));
