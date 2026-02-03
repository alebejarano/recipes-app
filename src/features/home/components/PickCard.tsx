import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';

import { createThemedStyles } from '@/styles/createStyles';
import { theme } from '@/styles/theme';

type Props = {
  label: string;
  title: string;
  subtitle?: string;
  emoji?: string;
  imageUrl?: string;
  onPress?: () => void;
};

export default function PickCard({
  label,
  title,
  subtitle,
  emoji,
  imageUrl,
  onPress,
}: Props) {
  const hasMedia = Boolean(emoji || imageUrl);

  return (
    <Pressable
      onPress={onPress}
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel={`Open ${title}`}
    >
      <View style={styles.left}>
        {hasMedia ? (
          <View style={styles.iconCircle}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.image} />
            ) : (
              <Text style={styles.emoji}>{emoji}</Text>
            )}
          </View>
        ) : null}

        <View style={styles.textBlock}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle ?? 'Light & satisfying'}
          </Text>
        </View>
      </View>

      <Feather name="chevron-right" size={22} color={theme.colors.mutedForeground} />
    </Pressable>
  );
}

const styles = createThemedStyles((theme) => ({
  card: {
    padding: theme.spacing.lg,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.muted,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  emoji: { fontSize: 22 },
  image: {
    width: '100%',
    height: '100%',
  },
  textBlock: { flex: 1 },
  label: {
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    fontFamily: theme.fontFamily.medium,
    color: theme.colors.primary,
    marginBottom: 2,
  },
  title: {
    fontSize: theme.fontSize.xl,
    lineHeight: theme.lineHeight.xl,
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.foreground,
  },
  subtitle: {
    marginTop: 4,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.mutedForeground,
  },
}));
