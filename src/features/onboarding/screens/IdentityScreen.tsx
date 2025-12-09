// src/features/onboarding/screens/IdentityScreen.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    MaterialIcons,
    Ionicons,
    MaterialCommunityIcons,
    Feather,
} from '@expo/vector-icons';
import Button from '@/components/Button';
import { createThemedStyles } from '@/styles/createStyles';

interface IdentityScreenProps {
    onContinue: (selected: string[]) => void;
}

const options = [
    {
        id: 'organize',
        label: 'I want all my recipes in one place.',
        icon: (style: any) => (
            <MaterialIcons name="folder-open" size={20} style={style} />
        ),
    },
    {
        id: 'screenshots',
        label: 'I want to stop losing screenshots and bookmarks.',
        icon: (style: any) => (
            <Ionicons name="image-outline" size={20} style={style} />
        ),
    },
    {
        id: 'healthy',
        label: 'I want to eat healthier with less decision fatigue.',
        icon: (style: any) => (
            <MaterialCommunityIcons
                name="food-variant"
                size={20}
                style={style}
            />
        ),
    },
    {
        id: 'planning',
        label: 'I want to plan my meals more easily.',
        icon: (style: any) => (
            <Feather name="calendar" size={20} style={style} />
        ),
    },
    {
        id: 'inspiration',
        label: 'I want inspiration based on what I already have at home.',
        icon: (style: any) => (
            <Ionicons name="sparkles-outline" size={20} style={style} />
        ),
    },
];

export default function IdentityScreen({ onContinue }: IdentityScreenProps) {
    const [selected, setSelected] = useState<string[]>([]);

    const toggleOption = (id: string) => {
        setSelected(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id],
        );
    };

    const isContinueDisabled = selected.length === 0;

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.content}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>What brings you here?</Text>
                        <Text style={styles.subtitle}>
                            Select all that resonate with you.
                        </Text>
                    </View>

                    {/* Options list */}
                    <ScrollView
                        contentContainerStyle={styles.optionsList}
                        showsVerticalScrollIndicator={false}
                    >
                        {options.map(option => {
                            const isSelected = selected.includes(option.id);
                            const iconStyle = isSelected
                                ? styles.addIconColor
                                : styles.mutedIconColor;

                            return (
                                <TouchableOpacity
                                    key={option.id}
                                    activeOpacity={0.9}
                                    onPress={() => toggleOption(option.id)}
                                    style={[
                                        styles.optionCard,
                                        isSelected
                                            ? styles.optionCardSelected
                                            : styles.optionCardUnselected,
                                    ]}
                                >
                                    <View
                                        style={[
                                            styles.optionIconWrapper,
                                            isSelected
                                                ? styles.optionIconWrapperSelected
                                                : styles.optionIconWrapperUnselected,
                                        ]}
                                    >
                                        {option.icon(iconStyle)}
                                    </View>

                                    <Text style={styles.optionLabel}>
                                        {option.label}
                                    </Text>

                                    <View
                                        style={[
                                            styles.checkbox,
                                            isSelected
                                                ? styles.checkboxSelected
                                                : styles.checkboxUnselected,
                                        ]}
                                    >
                                        {isSelected && (
                                            <Feather
                                                name="check"
                                                size={14}
                                                style={styles.addIconColor}
                                            />
                                        )}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Continue button */}
                <View style={styles.buttonWrapper}>
                    <Button
                        variant="primary"
                        size="xl"
                        disabled={isContinueDisabled}
                        onPress={() => onContinue(selected)}
                    >
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
    },
    content: {
        flex: 1,
    },

    /* icons */
    addIconColor: {
        color: theme.colors.primaryForeground,
    },
    mutedIconColor: {
        color: theme.colors.mutedForeground,
    },

    header: {
        marginBottom: theme.spacing.lg,
    },
    title: {
        fontFamily: theme.fontFamily.semibold,
        fontSize: theme.fontSize.display,
        lineHeight: theme.lineHeight.display,
        color: theme.colors.foreground,
        marginBottom: theme.spacing.xs,
    },
    subtitle: {
        fontFamily: theme.fontFamily.regular,
        fontSize: theme.fontSize.base,
        lineHeight: theme.lineHeight.base,
        color: theme.colors.mutedForeground,
    },

    optionsList: {
        paddingBottom: theme.spacing.xl,
    },

    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.radii.xl,
        borderWidth: 2,
        marginBottom: theme.spacing.sm,
    },
    optionCardUnselected: {
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.card,
    },
    optionCardSelected: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.sageLight,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
    },

    optionIconWrapper: {
        width: 40,
        height: 40,
        borderRadius: theme.radii.lg,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing.md,
    },
    optionIconWrapperUnselected: {
        backgroundColor: theme.colors.secondary,
    },
    optionIconWrapperSelected: {
        backgroundColor: theme.colors.primary,
    },

    optionLabel: {
        flex: 1,
        fontFamily: theme.fontFamily.medium,
        fontSize: theme.fontSize.base,
        lineHeight: theme.lineHeight.base,
        color: theme.colors.foreground,
    },

    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
    },
    checkboxUnselected: {
        borderColor: theme.colors.border,
        backgroundColor: 'transparent',
    },
    checkboxSelected: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primary,
    },

    buttonWrapper: {
        marginTop: theme.spacing.md,
    },
}));
