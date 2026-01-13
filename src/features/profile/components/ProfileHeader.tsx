import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

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

      <TouchableOpacity
        onPress={onPressSettings}
        activeOpacity={0.85}
        style={styles.settingsButton}
      >
        <Feather name="settings" size={18} style={styles.settingsIcon} />
      </TouchableOpacity>
    </View>
  );
}

const styles = createThemedStyles((theme) => ({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
    marginTop: theme.spacing['3xl'],
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
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    color: theme.colors.mutedForeground,
  },
}));
