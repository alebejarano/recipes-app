import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { createThemedStyles } from '@/styles/createStyles';
import { layout } from '@/styles/layout';

type Props = {
  name: string;
  subtitle: string;
  onPressEdit?: () => void;
};

export default function ProfileUserCard({ name, subtitle, onPressEdit }: Props) {
  const content = (
    <>
      <View style={styles.avatar}>
        <Text style={styles.avatarEmoji}>👩‍🍳</Text>
      </View>

      <View style={styles.center}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
      </View>

      {onPressEdit ? <Feather name="chevron-right" size={28} style={styles.chevron} /> : null}
    </>
  )

  if (!onPressEdit) return <View style={styles.card}>{content}</View>

  return (
    <Pressable
      onPress={onPressEdit}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${name}. ${subtitle}`}
    >
      {content}
    </Pressable>
  )
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
    marginRight: theme.spacing.lg,
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
  subtitle: {
    marginTop: 2,
    ...theme.textVariants.body,
    color: theme.colors.mutedForeground,
  },
  chevron: {
    color: theme.colors.mutedForeground,
    marginLeft: theme.spacing.md,
  },
  pressed: {
    opacity: 0.8,
  },
}));
