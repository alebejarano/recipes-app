// src/features/onboarding/screens/SpaceReadyScreen.tsx
import Button from '@/components/Button';
import IllustrationHero from '@/components/IllustrationHero';
import { createThemedStyles } from '@/styles/createStyles';
import spaceReadyIllustration from '@assets/illustrations/space-ready-illustration.png';
import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

interface SpaceReadyScreenProps {
  onAddRecipe: () => void;
  onSkip: () => void;
}


export default function SpaceReadyScreen({
                                             onAddRecipe,
                                             onSkip,
                                         }: SpaceReadyScreenProps) {
    return (

        <View style={styles.container}>
            {/* TOP: illustration + text (keeps a tight, controlled spacing) */}
            <View style={styles.topBlock}>
                <IllustrationHero
                    source={spaceReadyIllustration}
                    maxWidth={360}
                    maxHeight={320}
                    aspectRatio={4 / 3}
                    resizeMode="contain"  
                    style={styles.hero}
                />

                <View style={styles.textBlock}>
                    <View style={styles.badge}>
                    <View style={styles.badgeDot} />
                    <Text style={styles.badgeText}>Ready for you</Text>
                    </View>

                    <Text style={styles.title}>
                    Your personal recipe{'\n'}space is ready.
                    </Text>

                    <Text style={styles.subtitle}>
                    Everything you save will be beautifully organized automatically.
                    </Text>
                </View>
            </View>

            {/* BOTTOM: actions */}
            <View style={styles.buttonGroup}>
            <Button
                onPress={onAddRecipe}
                size="xl"
                variant="primary"
                icon={<Feather name="plus" size={20} style={styles.addIconColor} />}
            >
                Add a Recipe
            </Button>

            <Button
                onPress={onSkip}
                variant="ghost"
                size="lg"
                textStyle={styles.skipText}
                style={styles.skipButton}
            >
                Skip for Now
            </Button>
            </View>
        </View>
    );
}

const styles = createThemedStyles(theme => ({
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  topBlock: {
    width: '100%',
    alignItems: 'center',
  },

  hero: {
    marginBottom: theme.spacing['4xl'],
  },

  addIconColor: {
    color: theme.colors.primaryForeground,
  },


  /* Text content */
  textBlock: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
  },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.sageLight,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.primary,
    marginRight: theme.spacing.sm,
  },
   badgeText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.sageDark,
  },

  title: {
    textAlign: 'center',
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.display,
    lineHeight: theme.lineHeight.display,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.lg,
  },

  subtitle: {
    textAlign: 'center',
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
    maxWidth: 340,
    marginBottom: theme.spacing['3xl'],
  },
 buttonGroup: {
    width: '100%',
    maxWidth: 360,
    paddingBottom: theme.spacing.lg,
  },
  skipButton: {
    marginTop: theme.spacing.sm,
  },
  skipText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.base,
    color: theme.colors.mutedForeground,
  },
}));
