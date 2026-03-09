import { router } from 'expo-router'
import React from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { createThemedStyles } from '@/styles/createStyles'

export default function PrivacyPolicyScreen() {
    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.content}>
                <Pressable
                    onPress={() => router.back()}
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                    style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
                >
                    <Text style={styles.backButtonText}>Back</Text>
                </Pressable>

                <View style={styles.header}>
                    <Text style={styles.title}>Privacy Policy</Text>
                    <Text style={styles.subtitle}>
                        We&apos;re preparing this page. Full privacy policy details will be added next.
                    </Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Coming soon</Text>
                    <Text style={styles.cardBody}>
                        This placeholder page is live so you can navigate to Privacy Policy from onboarding.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = createThemedStyles((theme) => ({
    safeArea: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    content: {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.xl,
        gap: theme.spacing.lg,
    },
    backButton: {
        alignSelf: 'flex-start',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.radii.full,
        backgroundColor: theme.colors.secondary,
    },
    backButtonText: {
        fontFamily: theme.fontFamily.medium,
        fontSize: theme.fontSize.base,
        lineHeight: theme.lineHeight.base,
        color: theme.colors.foreground,
    },
    pressed: {
        opacity: 0.75,
    },
    header: {
        gap: theme.spacing.xs,
    },
    title: {
        fontFamily: theme.fontFamily.semibold,
        fontSize: theme.fontSize['4xl'],
        lineHeight: theme.lineHeight['4xl'],
        color: theme.colors.foreground,
    },
    subtitle: {
        fontFamily: theme.fontFamily.regular,
        fontSize: theme.fontSize.base,
        lineHeight: theme.lineHeight.base,
        color: theme.colors.mutedForeground,
    },
    card: {
        borderRadius: theme.radii.xl,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.card,
        padding: theme.spacing.lg,
        gap: theme.spacing.sm,
    },
    cardTitle: {
        fontFamily: theme.fontFamily.semibold,
        fontSize: theme.fontSize.xl,
        lineHeight: theme.lineHeight.xl,
        color: theme.colors.foreground,
    },
    cardBody: {
        fontFamily: theme.fontFamily.regular,
        fontSize: theme.fontSize.base,
        lineHeight: theme.lineHeight.base,
        color: theme.colors.mutedForeground,
    },
}))
