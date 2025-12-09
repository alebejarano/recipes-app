// src/features/onboarding/screens/AddRecipeScreen.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';

import Button from '@/components/Button';
import { createThemedStyles } from '@/styles/createStyles';

interface AddRecipeScreenProps {
    onSelectManual: () => void;
}

type ImportMethodId = 'link' | 'screenshot' | 'manual';

const importMethods = [
    {
        id: 'link' as const,
        title: 'Paste a link',
        description: 'Coming soon',
        disabled: true,
        icon: (style: any) => <Feather name="link-2" size={20} style={style} />,
    },
    {
        id: 'screenshot' as const,
        title: 'Import screenshot',
        description: 'Coming soon',
        disabled: true,
        icon: (style: any) => <Ionicons name="image-outline" size={20} style={style} />,
    },
    {
        id: 'manual' as const,
        title: 'Add manually',
        description: 'Type or paste recipe details',
        disabled: false,
        icon: (style: any) => <Feather name="edit-3" size={20} style={style} />,
    },
];


export default function AddRecipeScreen({ onSelectManual }: AddRecipeScreenProps) {
    const [selected, setSelected] = useState<ImportMethodId | null>(null);

    const handleSelect = (methodId: ImportMethodId, disabled: boolean) => {
        if (disabled) return;
        setSelected(methodId);
    };

    const handleContinue = () => {
        if (selected === 'manual') {
            onSelectManual();
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.content}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Add your first recipe</Text>
                        <Text style={styles.subtitle}>
                            Choose how you&#39;d like to add it.
                        </Text>
                    </View>

                    {/* Methods list */}
                    <ScrollView
                        contentContainerStyle={styles.methodsList}
                        showsVerticalScrollIndicator={false}
                    >
                        {importMethods.map((method, index) => {
                            const isSelected = selected === method.id;
                            const isDisabled = method.disabled;

                            const iconStyle = isDisabled
                                ? styles.iconMutedColor
                                : isSelected
                                    ? styles.iconPrimaryColor
                                    : styles.iconSecondaryColor;

                            return (
                                <TouchableOpacity
                                    key={method.id}
                                    activeOpacity={isDisabled ? 1 : 0.9}
                                    disabled={isDisabled}
                                    onPress={() => handleSelect(method.id, isDisabled)}
                                    style={[
                                        styles.methodCard,
                                        isDisabled && styles.methodCardDisabled,
                                        !isDisabled &&
                                        (isSelected
                                            ? styles.methodCardSelected
                                            : styles.methodCardUnselected),
                                    ]}
                                >
                                    {/* Left icon circle */}
                                    <View
                                        style={[
                                            styles.methodIconWrapper,
                                            isDisabled
                                                ? styles.methodIconWrapperDisabled
                                                : isSelected
                                                    ? styles.methodIconWrapperSelected
                                                    : styles.methodIconWrapperUnselected,
                                        ]}
                                    >
                                        {method.icon(iconStyle)}
                                    </View>

                                    {/* Text */}
                                    <View style={styles.methodTextWrapper}>
                                        <Text
                                            style={[
                                                styles.methodTitle,
                                                isDisabled && styles.methodTitleDisabled,
                                            ]}
                                        >
                                            {method.title}
                                        </Text>
                                        <Text style={styles.methodDescription}>
                                            {method.description}
                                        </Text>
                                    </View>

                                    {/* Right icon (lock or arrow) */}
                                    {isDisabled ? (
                                        <Feather
                                            name="lock"
                                            size={16}
                                            style={styles.lockIcon}
                                        />
                                    ) : (
                                        <Feather
                                            name="arrow-right"
                                            size={20}
                                            style={[
                                                styles.arrowIcon,
                                                isSelected
                                                    ? styles.arrowIconVisible
                                                    : styles.arrowIconHidden,
                                            ]}
                                        />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Continue button only when something is selected */}
                {selected && (
                    <View style={styles.buttonWrapper}>
                        <Button
                            onPress={handleContinue}
                            size="xl"
                            variant="primary"
                        >
                            Continue
                        </Button>
                    </View>
                )}
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

    header: {
        marginBottom: theme.spacing.lg,
        alignItems: 'center',
    },
    title: {
        fontFamily: theme.fontFamily.semibold,
        fontSize: theme.fontSize.display,
        lineHeight: theme.lineHeight.display,
        color: theme.colors.foreground,
        marginBottom: theme.spacing.xs,
        textAlign: 'center',
    },
    subtitle: {
        fontFamily: theme.fontFamily.regular,
        fontSize: theme.fontSize.base,
        lineHeight: theme.lineHeight.base,
        color: theme.colors.mutedForeground,
        textAlign: 'center',
    },

    methodsList: {
        paddingBottom: theme.spacing.xl,
    },

    methodCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.radii.xl,
        borderWidth: 2,
        marginBottom: theme.spacing.sm,
    },
    methodCardUnselected: {
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.card,
    },
    methodCardSelected: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.sageLight,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
    },
    methodCardDisabled: {
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.secondary,
        opacity: 0.6,
    },

    methodIconWrapper: {
        width: 48,
        height: 48,
        borderRadius: theme.radii.xl,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing.md,
    },
    methodIconWrapperUnselected: {
        backgroundColor: theme.colors.secondary,
    },
    methodIconWrapperSelected: {
        backgroundColor: theme.colors.primary,
    },
    methodIconWrapperDisabled: {
        backgroundColor: theme.colors.muted,
    },

    methodTextWrapper: {
        flex: 1,
    },
    methodTitle: {
        fontFamily: theme.fontFamily.semibold,
        fontSize: theme.fontSize.lg,
        lineHeight: theme.lineHeight.lg,
        color: theme.colors.foreground,
    },
    methodTitleDisabled: {
        color: theme.colors.mutedForeground,
    },
    methodDescription: {
        marginTop: theme.spacing.xs,
        fontFamily: theme.fontFamily.regular,
        fontSize: theme.fontSize.sm,
        lineHeight: theme.lineHeight.sm,
        color: theme.colors.mutedForeground,
    },

    /* Icon colors (used as style objects) */
    iconPrimaryColor: {
        color: theme.colors.primaryForeground,
    },
    iconSecondaryColor: {
        color: theme.colors.mutedForeground,
    },
    iconMutedColor: {
        color: theme.colors.mutedForeground,
    },

    lockIcon: {
        color: theme.colors.mutedForeground,
        marginLeft: theme.spacing.md,
    },

    arrowIcon: {
        marginLeft: theme.spacing.md,
    },
    arrowIconHidden: {
        opacity: 0,
    },
    arrowIconVisible: {
        opacity: 1,
        color: theme.colors.primary,
    },

    buttonWrapper: {
        marginTop: theme.spacing.md,
    },
}));
