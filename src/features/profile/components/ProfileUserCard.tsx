import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { createThemedStyles } from '@/styles/createStyles';

type Props = {
  name: string;
  email: string;
  onPressEdit?: () => void;
};

export default function ProfileUserCard({ name, email, onPressEdit }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.avatarEmoji}>👩‍🍳</Text>
      </View>

      <View style={styles.center}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.email}>{email}</Text>
      </View>

      <TouchableOpacity onPress={onPressEdit} activeOpacity={0.85} style={styles.editButton}>
        <Text style={styles.editText}>Edit</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = createThemedStyles((theme) => ({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.radii.xl,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    overflow: 'hidden',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  avatarEmoji: {
    fontSize: 24,
  },
  center: {
    flex: 1,
  },
  name: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.xl,
    lineHeight: theme.lineHeight.xl,
    color: theme.colors.foreground,
  },
  email: {
    marginTop: 2,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
  },
  editButton: {
    paddingLeft: theme.spacing.md,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  editText: {
    textAlign: 'right',
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.foreground,
  },
}));
