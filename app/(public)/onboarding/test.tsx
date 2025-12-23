// app/onboarding/WelcomeScreen.tsx
import Button from '@/components/Button';
import IllustrationHero from '@/components/IllustrationHero';
import OnboardingLayout from '@/features/onboarding/components/OnboardingLayout';
import { createThemedStyles } from '@/styles/createStyles';
import welcomeIllustration from '@assets/illustrations/welcome-illustration.png';
import React from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface WelcomeScreenProps {
    onContinue: () => void;
}

export default function WelcomeScreen({ onContinue }: WelcomeScreenProps) {
    
    return (
        <OnboardingLayout step={1} totalSteps={3}>
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Illustration */}
                <View style={styles.heroBlock}>
                    <IllustrationHero
                        source={welcomeIllustration}
                        maxWidth={360}
                        maxHeight={320}
                        aspectRatio={4 / 3}
                        resizeMode="contain" 
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
        </OnboardingLayout>
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
    heroBlock: {
        marginTop: theme.spacing.lg,
        width: '100%',
        alignItems: 'center',
    },
    textBlock: {
        alignItems: 'center',
        paddingHorizontal: theme.spacing.sm,
        marginVertical: theme.spacing.xl,
    },
    title: {
        textAlign: 'center',
        fontFamily: theme.fontFamily.semibold,
        fontSize: theme.fontSize.hero,
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
