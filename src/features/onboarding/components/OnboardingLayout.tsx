// src/features/onboarding/components/OnboardingLayout.tsx

import React, { ReactNode } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { createThemedStyles } from '@/styles/createStyles';

type OnboardingLayoutProps = {
    step: number;          // 1-based current step
    totalSteps: number;    // total steps, 0 means "no progress"
    children: ReactNode;
    showBackButton?: boolean;
    onBackPress?: () => void;
};

export default function OnboardingLayout({
                                             step,
                                             totalSteps,
                                             children,
                                             showBackButton = false,
                                             onBackPress,
                                         }: OnboardingLayoutProps) {
    const showProgress = totalSteps > 0 && step > 0 && step <= totalSteps;
    const progress =
        showProgress && totalSteps > 0 ? step / totalSteps : 0;

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
            >
                {/* Header: back + progress */}
                <View style={styles.header}>
                    {showBackButton && onBackPress ? (
                        <TouchableOpacity
                            onPress={onBackPress}
                            style={styles.backRow}
                        >
                            <Feather
                                name="arrow-left"
                                size={18}
                                style={styles.backIcon}
                            />
                            <Text style={styles.backText}>Back</Text>
                        </TouchableOpacity>
                    ) : (
                        // keep spacing even when no back button
                        <View style={styles.backPlaceholder} />
                    )}

                    {showProgress && (
                        <View style={styles.progressContainer}>
                            <Text style={styles.progressLabel}>
                                Step {step} of {totalSteps}
                            </Text>
                            <View style={styles.progressTrack}>
                                <View
                                    style={[
                                        styles.progressBar,
                                        { width: `${Math.min(progress * 100, 100)}%` },
                                    ]}
                                />
                            </View>
                        </View>
                    )}
                </View>

                {/* Main content */}
                <View style={styles.body}>
                    {children}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = createThemedStyles(theme => ({
    safeArea: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    content: {
        flexGrow: 1,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.xl,
    },

    /* Header row: back + progress */
    header: {
        marginBottom: theme.spacing.lg,
    },

    backRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    backIcon: {
        color: theme.colors.warmGray,
        marginRight: theme.spacing.xs,
    },
    backText: {
        fontFamily: theme.fontFamily.medium,
        fontSize: theme.fontSize.sm,
        color: theme.colors.warmGray,
    },
    backPlaceholder: {
        height: 24, // approximate height of backRow to keep spacing consistent
        marginBottom: theme.spacing.sm,
    },

    progressContainer: {},
    progressLabel: {
        fontFamily: theme.fontFamily.medium,
        fontSize: theme.fontSize.xs,
        color: theme.colors.mutedForeground,
        marginBottom: theme.spacing.xs,
    },
    progressTrack: {
        height: 6,
        borderRadius: 999,
        backgroundColor: theme.colors.creamDark,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        borderRadius: 999,
        backgroundColor: theme.colors.sage,
    },

    /* Body: where screens render */
    body: {
        flex: 1,
        // most onboarding screens are centered-ish, but they can manage their own layout
    },
}));
