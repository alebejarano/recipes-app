import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useTranslation } from '@/localization';
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
  const { t } = useTranslation();
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
      style={({ pressed }) => [styles.cardPressable, pressed && styles.cardPressablePressed]}
      accessibilityRole="button"
      accessibilityLabel={t('home.cards.openRecipeA11y', { title })}
    >
      <LinearGradient
        colors={[theme.colors.primary15, theme.colors.primary10, theme.colors.accent10]}
        locations={[0, 0.52, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
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
              {subtitle ?? t('home.picks.fitsRightNow')}
            </Text>
          </View>
        </View>

        <Feather name="chevron-right" size={22} color={theme.colors.primary} />
      </LinearGradient>
    </Pressable>
  );
}

const styles = createThemedStyles((theme) => ({
  cardPressable: {
    borderRadius: theme.radii.lg,
    overflow: 'hidden',
  },
  cardPressablePressed: {
    opacity: 0.92,
  },
  card: {
    padding: layout.cardPadding,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.primary16,
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
    overflow: 'hidden',
  },
  emoji: { fontSize: 22 },
  image: {
    width: '100%',
    height: '100%',
  },
  textBlock: { flex: 1 },
  label: {
    ...theme.textVariants.label,
    color: theme.colors.primary,
    marginBottom: 2,
  },
  title: {
    ...theme.textVariants.heading,
    color: theme.colors.foreground,
  },
  subtitle: {
    marginTop: 4,
    ...theme.textVariants.body,
    color: theme.colors.mutedForeground,
  },
}));
