import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { createThemedStyles } from '@/styles/createStyles';
import { layout } from '@/styles/layout';

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

      {onPressEdit ? (
        <Pressable
          onPress={onPressEdit}
          style={({ pressed }) => [styles.editAction, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Edit profile"
        >
          <Text style={styles.editText}>Edit</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = createThemedStyles((theme) => ({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: layout.cardPadding,
    marginBottom: theme.spacing.xl,
    overflow: 'hidden',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.primary,
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
    ...theme.textVariants.heading,
    color: theme.colors.foreground,
  },
  email: {
    marginTop: 2,
    ...theme.textVariants.body,
    color: theme.colors.mutedForeground,
  },
  editAction: {
    marginLeft: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  editText: {
    ...theme.textVariants.label,
    color: theme.colors.primary,
  },
  pressed: {
    opacity: 0.8,
  },
}));
