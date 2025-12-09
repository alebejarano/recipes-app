// src/features/onboarding/screens/SpaceReadyScreen.tsx
import React from 'react';
import { Image, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Button from '@/components/Button';
import { createThemedStyles } from '@/styles/createStyles';
import spaceReadyIllustration from '@assets/illustrations/space-ready-illustration.png';

interface SpaceReadyScreenProps {
    onAddRecipe: () => void;
    onSkip: () => void;
}

export default function SpaceReadyScreen({
                                             onAddRecipe,
                                             onSkip,
                                         }: SpaceReadyScreenProps) {
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Illustration */}
                <View style={styles.illustrationWrapper}>
                    <Image
                        source={spaceReadyIllustration}
                        style={styles.illustration}
                        resizeMode="cover"
                    />
                </View>

                {/* Text block */}
                <View style={styles.textBlock}>
                    <View style={styles.badge}>
                        <View style={styles.badgeDot} />
                        <Text style={styles.badgeText}>Ready for you</Text>
                    </View>

                    <Text style={styles.title}>
                        Your personal recipe{'\n'}space is ready.
                    </Text>

                    <Text style={styles.subtitle}>
                        Everything you save will be beautifully organized
                        automatically.
                    </Text>
                </View>

                {/* Actions */}
                <View style={styles.buttonGroup}>
                    <Button
                        onPress={onAddRecipe}
                        size="xl"
                        variant="primary"
                        icon={
                            <Feather
                                name="plus"
                                size={20}
                                style={styles.addIconColor}
                            />
                        }
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
        </SafeAreaView>
    );
}

const styles = createThemedStyles(theme => ({
    safeArea: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    container: {
        flex: 1,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.xl,
        alignItems: 'center',
    },
    /* icons*/
    addIconColor: {
        color: theme.colors.primaryForeground
    },

    /* Illustration */
    illustrationWrapper: {
        width: '100%',
        maxWidth: 360,
        borderRadius: theme.radii.xxl,
        overflow: 'hidden',
        marginBottom: theme.spacing.xl,
    },
    illustration: {
        width: '100%',
        aspectRatio: 4 / 3,
    },

    /* Text content */
    textBlock: {
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
        paddingHorizontal: theme.spacing.sm,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: 999,
        backgroundColor: theme.colors.sageLight,
        marginBottom: theme.spacing.md,
    },
    badgeDot: {
        width: 8,
        height: 8,
        borderRadius: 999,
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
        marginBottom: theme.spacing.sm,
    },
    subtitle: {
        textAlign: 'center',
        fontFamily: theme.fontFamily.regular,
        fontSize: theme.fontSize.base,
        lineHeight: theme.lineHeight.base,
        color: theme.colors.mutedForeground,
        maxWidth: 340,
    },

    /* Buttons */
    buttonGroup: {
        width: '100%',
        maxWidth: 360,
        marginTop: theme.spacing.lg,
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
