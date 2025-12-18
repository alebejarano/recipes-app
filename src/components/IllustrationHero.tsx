// src/components/IllustrationHero.tsx
import { createThemedStyles } from '@/styles/createStyles';
import React from 'react';
import {
    Image,
    ImageResizeMode,
    ImageSourcePropType,
    StyleProp,
    useWindowDimensions,
    View,
    ViewStyle,
} from 'react-native';

type IllustrationHeroProps = {
  source: ImageSourcePropType;

  maxWidth?: number;      // default: 360
  aspectRatio?: number;   // default: 4/3
  maxHeight?: number;     // default: 320

  rounded?: boolean;      // default: false
  resizeMode?: ImageResizeMode; // default: 'contain'
  style?: StyleProp<ViewStyle>;
};

export default function IllustrationHero({
  source,
  maxWidth = 360,
  aspectRatio = 4 / 3,
  maxHeight = 320,
  rounded = false,
  resizeMode = 'contain',
  style,
}: IllustrationHeroProps) {
  const { width: screenWidth } = useWindowDimensions();

  // Approx available width (since your screens typically have paddingHorizontal: theme.spacing.lg)
  // You can pass a smaller maxWidth, so we clamp to it.
  const contentWidth = Math.min(screenWidth, maxWidth);
  const computedHeight = Math.min(maxHeight, contentWidth / aspectRatio);

  return (
    <View
      style={[
        styles.wrapper,
        { maxWidth, height: computedHeight },
        rounded ? styles.rounded : undefined,
        style,
      ]}
    >
      <Image source={source} resizeMode={resizeMode} style={styles.image} />
    </View>
  );
}

const styles = createThemedStyles(theme => ({
  wrapper: {
    width: '100%',
    alignSelf: 'center',
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  rounded: {
    borderRadius: theme.radii.xxl,
  },
  image: {
    width: '100%',
    height: '100%',
  },
}));
