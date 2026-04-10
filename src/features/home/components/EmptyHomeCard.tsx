import { Feather } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import React from 'react';
import { Text, View } from 'react-native';

import Button from '@/components/Button';
import { createThemedStyles } from '@/styles/createStyles';

type Props = {
  title: string;
  body: string;
  primaryLabel: string;
  secondaryLabel: string;
  onPressPrimary: () => void;
  onPressSecondary: () => void;
};

export default function EmptyHomeCard({
  title,
  body,
  primaryLabel,
  secondaryLabel,
  onPressPrimary,
  onPressSecondary,
}: Props) {
  return (
    <View style={styles.wrapper}>
      <ExpoImage
        source={require('@assets/illustrations/recipe-silhouette.png')}
        style={styles.illustration}
        contentFit="contain"
      />

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>

      <View style={styles.actions}>
        <Button
          variant="primary"
          size="xl"
          onPress={onPressPrimary}
          icon={<Feather name="plus" size={22} style={styles.primaryIcon} />}
          style={styles.primaryButton}
        >
          {primaryLabel}
        </Button>

        <Button
          variant="ghost"
          size="lg"
          onPress={onPressSecondary}
          icon={<Feather name="file-text" size={20} style={styles.secondaryIcon} />}
          style={styles.secondaryButton}
          textStyle={styles.secondaryText}
        >
          {secondaryLabel}
        </Button>
      </View>
    </View>
  );
}

const styles = createThemedStyles((theme) => ({
  wrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: theme.spacing['3xl'],
  },
  illustration: {
    width: 320,
    height: 240,
    marginBottom: theme.spacing['2xl'],
  },
  title: {
    maxWidth: 360,
    textAlign: 'center',
    fontSize: theme.fontSize.display,
    lineHeight: theme.lineHeight.display,
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.foreground,
  },
  body: {
    maxWidth: 360,
    marginTop: theme.spacing.md,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    marginTop: theme.spacing['2xl'],
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  primaryButton: {
    maxWidth: 480,
    borderRadius: theme.radii.full,
    ...theme.shadows.soft,
  },
  primaryIcon: {
    color: theme.colors.primaryForeground,
  },
  secondaryButton: {
    width: 'auto',
    minHeight: 0,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  secondaryIcon: {
    color: theme.colors.mutedForeground,
  },
  secondaryText: {
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    fontFamily: theme.fontFamily.medium,
    color: theme.colors.mutedForeground,
  },
}));
