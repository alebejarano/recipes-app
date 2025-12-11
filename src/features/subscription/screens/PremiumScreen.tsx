// src/features/subscription/screens/PremiumScreen.tsx
import React from 'react';
import {
    View,
    Text,
    ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '@/components/Button';
import { createThemedStyles } from '@/styles/createStyles';

type PremiumScreenProps = {
    onUpgrade: () => void;
    onMaybeLater?: () => void;
};

const premiumBenefits = [
    'Unlimited recipes and collections',
    'Advanced filters and search',
    'Import from more sources (web, screenshots, etc.)',
    'Smart notes for ingredients and anti-inflammatory lists',
    'Priority backup and sync across devices',
];

export default function PremiumScreen({
                                          onUpgrade,
                                          onMaybeLater,
                                      }: PremiumScreenProps) {
    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                bounces
            >
                <View style={styles.container}>
                    {/* Badge / header */}
                    <View style={styles.badge}>
                        <Feather
                            name="star"
                            size={18}
                            style={styles.badgeIcon}
                        />
                        <Text style={styles.badgeText}>Premium</Text>
                    </View>

                    <Text style={styles.title}>
                        Keep your recipes organized for good
                    </Text>
                    <Text style={styles.subtitle}>
                        You’ve reached the free limit. Upgrade to Premium to keep adding
                        recipes, create more collections, and unlock powerful organization
                        tools.
                    </Text>

                    {/* Pricing card */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>What you get</Text>

                        <View style={styles.benefitsList}>
                            {premiumBenefits.map((item, index) => (
                                <View key={index} style={styles.benefitRow}>
                                    <View style={styles.benefitIconWrapper}>
                                        <Feather
                                            name="check"
                                            size={16}
                                            style={styles.benefitIcon}
                                        />
                                    </View>
                                    <Text style={styles.benefitText}>{item}</Text>
                                </View>
                            ))}
                        </View>

                        <View style={styles.priceRow}>
                            <Text style={styles.priceMain}>€X.XX</Text>
                            <Text style={styles.pricePeriod}> / month</Text>
                        </View>
                        <Text style={styles.priceNote}>
                            Cancel anytime. Your recipes stay safe.
                        </Text>

                        <Button
                            onPress={onUpgrade}
                            size="lg"
                            style={styles.upgradeButton}
                            textStyle={styles.upgradeButtonText}
                        >
                            Upgrade to Premium
                        </Button>

                        {onMaybeLater && (
                            <Button
                                onPress={onMaybeLater}
                                variant="soft"
                                size="lg"
                                style={styles.maybeLaterButton}
                                textStyle={styles.maybeLaterButtonText}
                            >
                                Maybe later
                            </Button>
                        )}
                    </View>

                    <Text style={styles.footerText}>
                        You can always find this page again from your Account tab.
                    </Text>
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
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.xl,
    },
    container: {
        flex: 1,
        alignItems: 'center',
    },

    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: 999,
        backgroundColor: theme.colors.terracottaLight,
        marginBottom: theme.spacing.md,
    },
    badgeIcon: {
        color: theme.colors.terracotta,
        marginRight: theme.spacing.xs,
    },
    badgeText: {
        fontFamily: theme.fontFamily.medium,
        fontSize: theme.fontSize.sm,
        color: theme.colors.terracotta,
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
        marginBottom: theme.spacing.xl,
        maxWidth: 380,
    },

    card: {
        width: '100%',
        maxWidth: 380,
        padding: theme.spacing.xl,
        borderRadius: theme.radii.xl,
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.border,
        ...theme.shadows.soft,
    },
    cardTitle: {
        fontFamily: theme.fontFamily.semibold,
        fontSize: theme.fontSize.xl,
        lineHeight: theme.lineHeight.xl,
        color: theme.colors.foreground,
        marginBottom: theme.spacing.md,
    },

    benefitsList: {
        marginBottom: theme.spacing.lg,
    },
    benefitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    benefitIconWrapper: {
        width: 28,
        height: 28,
        borderRadius: theme.radii.lg,
        backgroundColor: theme.colors.sageLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing.md,
    },
    benefitIcon: {
        color: theme.colors.sage,
    },
    benefitText: {
        flex: 1,
        fontFamily: theme.fontFamily.regular,
        fontSize: theme.fontSize.base,
        lineHeight: theme.lineHeight.base,
        color: theme.colors.mutedForeground,
    },

    priceRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: theme.spacing.xs,
    },
    priceMain: {
        fontFamily: theme.fontFamily.semibold,
        fontSize: theme.fontSize.hero,
        lineHeight: theme.lineHeight.hero,
        color: theme.colors.foreground,
    },
    pricePeriod: {
        marginLeft: theme.spacing.xs,
        fontFamily: theme.fontFamily.regular,
        fontSize: theme.fontSize.base,
        lineHeight: theme.lineHeight.base,
        color: theme.colors.mutedForeground,
        marginBottom: 4,
    },
    priceNote: {
        fontFamily: theme.fontFamily.regular,
        fontSize: theme.fontSize.sm,
        lineHeight: theme.lineHeight.base,
        color: theme.colors.mutedForeground,
        marginBottom: theme.spacing.lg,
    },

    upgradeButton: {
        width: '100%',
        borderRadius: 999,
        marginBottom: theme.spacing.sm,
        backgroundColor: theme.colors.primary,
    },
    upgradeButtonText: {
        fontFamily: theme.fontFamily.medium,
        fontSize: theme.fontSize.base,
        color: theme.colors.primaryForeground,
    },
    maybeLaterButton: {
        width: '100%',
        borderRadius: 999,
        backgroundColor: theme.colors.secondary,
    },
    maybeLaterButtonText: {
        fontFamily: theme.fontFamily.medium,
        fontSize: theme.fontSize.base,
        color: theme.colors.secondaryForeground,
    },

    footerText: {
        marginTop: theme.spacing.lg,
        textAlign: 'center',
        fontFamily: theme.fontFamily.regular,
        fontSize: theme.fontSize.xs,
        lineHeight: theme.lineHeight.sm,
        color: theme.colors.mutedForeground,
    },
}));
