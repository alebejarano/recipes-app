// src/features/onboarding/screens/MagicMomentScreen.tsx
import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '@/components/Button';
import OnboardingLayout from '@/features/onboarding/components/OnboardingLayout';
import { createThemedStyles } from '@/styles/createStyles';

interface MagicMomentScreenProps {
    onAddRecipe: () => void;
    onGoHome: () => void;
}

export default function MagicMomentScreen({
                                              onAddRecipe,
                                              onGoHome,
                                          }: MagicMomentScreenProps) {
    return (

        <OnboardingLayout step={2} totalSteps={3}>
            <SafeAreaView style={styles.safeArea}>
                        <View style={styles.container}>
                            <View style={styles.content}>
                                {/* Header */}
                                <View style={styles.header}>
                                    <Text style={styles.title}>
                                        This is how your recipes{'\n'}will look
                                    </Text>
                                    <Text style={styles.subtitle}>
                                        Clean, searchable, always with you.
                                    </Text>
                                </View>
            
                                {/* Sample recipe card */}
                                <View style={styles.card}>
                                    {/* Top image / hero */}
                                    <View style={styles.cardHero}>
                                        <View style={styles.emojiWrapper}>
                                            <Text style={styles.emoji}>🥗</Text>
                                        </View>
            
                                        <View style={styles.badgeRow}>
                                            <View style={styles.badgePill}>
                                                <Text style={styles.badgeText}>Healthy</Text>
                                            </View>
                                            <View style={styles.badgePill}>
                                                <Text style={styles.badgeText}>Quick</Text>
                                            </View>
                                        </View>
            
                                        <View style={styles.bookmarkButton}>
                                            <Feather
                                                name="bookmark"
                                                size={20}
                                                style={styles.bookmarkIcon}
                                            />
                                        </View>
                                    </View>
            
                                    {/* Card body */}
                                    <View style={styles.cardBody}>
                                        <Text style={styles.recipeTitle}>
                                            Mediterranean Quinoa Bowl
                                        </Text>
                                        <Text style={styles.recipeDescription}>
                                            A fresh, protein-packed bowl with crisp vegetables
                                            and tangy feta.
                                        </Text>
            
                                        <View style={styles.metaRow}>
                                            <View style={styles.metaItem}>
                                                <Feather
                                                    name="clock"
                                                    size={14}
                                                    style={styles.metaIcon}
                                                />
                                                <Text style={styles.metaText}>25 min</Text>
                                            </View>
                                            <View style={styles.metaItem}>
                                                <Feather
                                                    name="users"
                                                    size={14}
                                                    style={styles.metaIcon}
                                                />
                                                <Text style={styles.metaText}>2 servings</Text>
                                            </View>
                                        </View>
            
                                        {/* Ingredients preview */}
                                        <View style={styles.ingredientsCard}>
                                            <View style={styles.ingredientsHeader}>
                                                <Feather
                                                    name="tag"
                                                    size={12}
                                                    style={styles.ingredientsIcon}
                                                />
                                                <Text style={styles.ingredientsLabel}>
                                                    INGREDIENTS
                                                </Text>
                                            </View>
            
                                            <View style={styles.ingredientsChipsRow}>
                                                {[
                                                    'Quinoa',
                                                    'Cucumber',
                                                    'Cherry tomatoes',
                                                    'Feta',
                                                    '+4 more',
                                                ].map((ingredient, index) => (
                                                    <View
                                                        key={index}
                                                        style={styles.ingredientChip}
                                                    >
                                                        <Text style={styles.ingredientChipText}>
                                                            {ingredient}
                                                        </Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
        
                                    </View>
                                </View>
                            </View>
            
                            {/* Actions */}
                            <View style={styles.actions}>
                                <Button
                                    onPress={onAddRecipe}
                                    size="xl"
                                    variant="primary"
                                    icon={<Feather name="plus" size={20} style={styles.addIcon} />}
                                >
                                    Add Your First Recipe
                                </Button>
            
                                <Button
                                    onPress={onGoHome}
                                    size="lg"
                                    variant="ghost"
                                    textStyle={styles.goHomeText}
                                    style={styles.goHomeButton}
                                >
                                    Go to Home
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
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xxs,
    },
    content: {
        flex: 1,
    },

    /* Header */
    header: {
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
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
    },

    /* Card */
    card: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.radii.md,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.border,
        shadow: theme.shadows.soft,
        elevation: 2,
    },
    cardHero: {
        height: 180,
        backgroundColor: theme.colors.peach,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.md,
    },
    emojiWrapper: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    emoji: {
        fontSize: 48,
    },
    badgeRow: {
        position: 'absolute',
        top: theme.spacing.md,
        right: theme.spacing.md,
        flexDirection: 'row',
        gap: theme.spacing.xs,
    },
    badgePill: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.radii.full,
        backgroundColor: theme.colors.card,
        opacity: 0.9,
    },
    badgeText: {
        fontFamily: theme.fontFamily.medium,
        fontSize: theme.fontSize.xs,
        color: theme.colors.foreground,
    },
    bookmarkButton: {
        position: 'absolute',
        right: theme.spacing.md,
        bottom: theme.spacing.md,
        width: 40,
        height: 40,
        borderRadius: theme.radii.full,
        backgroundColor: theme.colors.card,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bookmarkIcon: {
        color: theme.colors.primary,
    },

    cardBody: {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
    },
    recipeTitle: {
        fontFamily: theme.fontFamily.semibold,
        fontSize: theme.fontSize.xl,
        lineHeight: theme.lineHeight.xl,
        color: theme.colors.foreground,
        marginBottom: theme.spacing.xs,
    },
    recipeDescription: {
        fontFamily: theme.fontFamily.regular,
        fontSize: theme.fontSize.sm,
        lineHeight: theme.lineHeight.base,
        color: theme.colors.mutedForeground,
        marginBottom: theme.spacing.md,
    },

    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.lg,
        marginBottom: theme.spacing.md,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
    },
    metaIcon: {
        color: theme.colors.mutedForeground,
    },
    metaText: {
        fontFamily: theme.fontFamily.regular,
        fontSize: theme.fontSize.sm,
        color: theme.colors.mutedForeground,
    },

    /* Ingredients */
    ingredientsCard: {
        backgroundColor: theme.colors.secondary,
        borderRadius: theme.radii.xl,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.md,
        marginBottom: theme.spacing.md,
    },
    ingredientsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
        marginBottom: theme.spacing.xs,
    },
    ingredientsIcon: {
        color: theme.colors.mutedForeground,
    },
    ingredientsLabel: {
        fontFamily: theme.fontFamily.medium,
        fontSize: theme.fontSize.xs,
        color: theme.colors.mutedForeground,
    },
    ingredientsChipsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.xs,
    },
    ingredientChip: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.radii.lg,
        backgroundColor: theme.colors.card,
    },
    ingredientChipText: {
        fontFamily: theme.fontFamily.regular,
        fontSize: theme.fontSize.xs,
        color: theme.colors.foreground,
    },

    /* Actions */
    actions: {
        marginTop: theme.spacing['4xl'],
    },
    addIcon: {
        color: theme.colors.primaryForeground,
    },
    goHomeButton: {
        marginTop: theme.spacing.lg,
    },
    goHomeText: {
        fontFamily: theme.fontFamily.medium,
        fontSize: theme.fontSize.lg,
        color: theme.colors.mutedForeground,
    },
}));
