import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { createThemedStyles } from '@/styles/createStyles';
import { layout } from '@/styles/layout';
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
  const normalizedImageUrl = useMemo(() => imageUrl?.trim() ?? '', [imageUrl]);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [normalizedImageUrl]);

  const hasImage = Boolean(normalizedImageUrl) && !imageFailed;
  const hasMedia = Boolean(emoji || hasImage);

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
            {hasImage ? (
              <Image
                source={{ uri: normalizedImageUrl }}
                style={styles.image}
                contentFit="cover"
                cachePolicy="memory-disk"
                onError={() => setImageFailed(true)}
              />
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
    padding: layout.cardPadding,
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
    gap: layout.cardGap,
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
