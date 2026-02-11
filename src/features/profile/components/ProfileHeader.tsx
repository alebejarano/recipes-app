import React from 'react';
import { Text, View } from 'react-native';

import { createThemedStyles } from '@/styles/createStyles';

type Props = {
  title: string;
  subtitle?: string;
  onPressSettings?: () => void;
};

export default function ProfileHeader({ title, subtitle, onPressSettings }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.left}>
        <Text style={styles.title}>{title}</Text>
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
}

const styles = createThemedStyles((theme) => ({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  left: {
    flex: 1,
    paddingRight: theme.spacing.md,
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
}));
