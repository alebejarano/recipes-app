// app/onboarding/WelcomeScreen.tsx
import React from 'react';
import { Image, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import welcomeIllustration from '@assets/illustrations/welcome-illustration.png';
import { createThemedStyles } from '@/styles/createStyles';
import Button from '@/components/Button';

interface WelcomeScreenProps {
    onContinue: () => void;
}

export default function WelcomeScreen({ onContinue }: WelcomeScreenProps) {
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Illustration */}
                <View style={styles.illustrationWrapper}>
                    <Image
                        source={welcomeIllustration}
                        style={styles.illustration}
                        resizeMode="cover"
                    />
                </View>

                {/* Text */}
                <View style={styles.textBlock}>
                    <Text style={styles.title}>
                        Welcome to your calm,{'\n'}
                        <Text style={styles.titleHighlight}>
                            organized recipe space.
                        </Text>
                    </Text>

                    <Text style={styles.subtitle}>
                        Collect your favorite recipes from everywhere, in one
                        peaceful place.
                    </Text>
                </View>

                {/* Button */}
                <View style={styles.buttonWrapper}>
                    <Button variant="primary" size="xl" onPress={onContinue}>
                        Continue
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
        justifyContent: 'space-between',
    },
    illustrationWrapper: {
        width: '100%',
        maxWidth: 360,
        borderRadius: theme.radii.xxl,
        overflow: 'hidden',
        marginTop: theme.spacing.lg,
    },
    illustration: {
        width: '100%',
        aspectRatio: 4 / 3,
        borderRadius: theme.radii.xxl,
    },
    textBlock: {
        alignItems: 'center',
        paddingHorizontal: theme.spacing.sm,
        marginVertical: theme.spacing.xl,
    },
    title: {
        textAlign: 'center',
        fontFamily: theme.fontFamily.semibold,
        fontSize: theme.fontSize.xxl,
        lineHeight: theme.lineHeight.xxl,
        color: theme.colors.foreground,
    },
    titleHighlight: {
        color: theme.colors.primary,
        fontFamily: theme.fontFamily.semibold,
    },
    subtitle: {
        marginTop: theme.spacing.md,
        textAlign: 'center',
        fontFamily: theme.fontFamily.regular,
        fontSize: theme.fontSize.base,
        lineHeight: theme.lineHeight.base,
        color: theme.colors.mutedForeground,
        maxWidth: 320,
    },
    buttonWrapper: {
        width: '100%',
        maxWidth: 320,
        marginBottom: theme.spacing.lg,
    },
}));
