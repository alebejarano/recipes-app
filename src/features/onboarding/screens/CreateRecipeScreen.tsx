// src/features/onboarding/screens/CreateRecipeScreen.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';

import Button from '@/components/Button';
import TagChip from "@/components/TagChip";
import { createThemedStyles } from '@/styles/createStyles';

interface CreateRecipeScreenProps {
    onSave: () => void;
    onBack?: () => void;
}

const suggestedTags = [
    'Dinner',
    'Quick',
    'Healthy',
    'Comfort Food',
    'Vegetarian',
    'Dessert',
];

export default function CreateRecipeScreen({
                                               onSave,
                                               onBack,
                                           }: CreateRecipeScreenProps) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isComplete, setIsComplete] = useState(false);

    const [titleFocused, setTitleFocused] = useState(false);
    const [contentFocused, setContentFocused] = useState(false);

    const toggleTag = (tag: string) => {
        setTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag],
        );
    };

    const handleSave = () => {
        if (!title.trim()) return;
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            setIsComplete(true);
            setTimeout(onSave, 1500);
        }, 1500);
    };

    const isValid = title.trim().length > 0;

    /* ========= COMPLETE STATE ========= */
    if (isComplete) {
        return (
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.centeredContainer}>
                        <View style={styles.completeCheckCircle}>
                            <Feather
                                name="check"
                                size={40}
                                style={styles.completeCheckIcon}
                            />
                        </View>

                        <View style={styles.completeTextBlock}>
                            <Text style={styles.completeTitle}>Recipe saved!</Text>
                            <Text style={styles.completeSubtitle}>
                                Settling into your collection...
                            </Text>
                        </View>

                        <View style={styles.previewCard}>
                            <View style={styles.previewEmojiWrapper}>
                                <Text style={styles.previewEmoji}>📝</Text>
                            </View>
                            <View style={styles.previewTextWrapper}>
                                <Text style={styles.previewTitle} numberOfLines={1}>
                                    {title}
                                </Text>
                                <Text style={styles.previewMeta}>Added just now</Text>
                            </View>
                            <Ionicons
                                name="sparkles-outline"
                                size={16}
                                style={styles.previewSparkles}
                            />
                        </View>
                    </View>
                </SafeAreaView>
        );
    }

    /* ========= SAVING STATE ========= */
    if (isSaving) {
        return (
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.centeredContainer}>
                        <View style={styles.savingCircleWrapper}>
                            <ActivityIndicator
                                size="large"
                                color={styles.savingSpinner.color}
                            />
                            <Ionicons
                                name="sparkles-outline"
                                size={32}
                                style={styles.savingSparkles}
                            />
                        </View>
                        <Text style={styles.savingTitle}>Saving your recipe...</Text>
                        <Text style={styles.savingSubtitle}>
                            Organizing everything beautifully
                        </Text>
                    </View>
                </SafeAreaView>
        );
    }

    /* ========= FORM STATE ========= */
    return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.container}>
                    <View style={styles.content}>
                        {onBack && (
                            <View style={styles.backWrapper}>
                                <Button
                                    variant="ghost"
                                    size="md"
                                    onPress={onBack}
                                    style={styles.backButton}
                                    textStyle={styles.backText}
                                    icon={
                                        <Feather
                                            name="arrow-left"
                                            size={16}
                                            style={styles.backIcon}
                                        />
                                    }
                                >
                                    Back
                                </Button>
                            </View>
                        )}

                        <ScrollView
                            contentContainerStyle={styles.scrollContent}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                        >
                            {/* Header */}
                            <View style={styles.header}>
                                <Text style={styles.title}>Create your recipe</Text>
                                <Text style={styles.subtitle}>
                                    Add the basics—you can always edit later.
                                </Text>
                            </View>

                            {/* Recipe Title */}
                            <View style={styles.fieldGroup}>
                                <Text style={styles.fieldLabel}>Recipe Title</Text>
                                <View
                                    style={[
                                        styles.inputWrapper,
                                        titleFocused && styles.inputWrapperFocused,
                                    ]}
                                >
                                    <TextInput
                                        value={title}
                                        onChangeText={setTitle}
                                        placeholder="e.g., Grandma's Pasta"
                                        placeholderTextColor={
                                            styles.inputPlaceholder.color
                                        }
                                        onFocus={() => setTitleFocused(true)}
                                        onBlur={() => setTitleFocused(false)}
                                        style={styles.input}
                                    />
                                </View>
                            </View>

                            {/* Instructions */}
                            <View style={styles.fieldGroup}>
                                <Text style={styles.fieldLabel}>
                                    Instructions or Notes
                                </Text>
                                <View
                                    style={[
                                        styles.textAreaWrapper,
                                        contentFocused && styles.inputWrapperFocused,
                                    ]}
                                >
                                    <TextInput
                                        value={content}
                                        onChangeText={setContent}
                                        placeholder="Paste your recipe here, or jot down the steps..."
                                        placeholderTextColor={
                                            styles.inputPlaceholder.color
                                        }
                                        multiline
                                        textAlignVertical="top"
                                        onFocus={() => setContentFocused(true)}
                                        onBlur={() => setContentFocused(false)}
                                        style={styles.textArea}
                                    />
                                </View>
                            </View>

                            {/* Tags */}
                            <View style={styles.fieldGroup}>
                                <Text style={styles.fieldLabel}>
                                    Tags (optional)
                                </Text>

                                <View style={styles.tagsContainer}>
                                    {suggestedTags.map(tag => (
                                        <TagChip
                                            key={tag}
                                            label={tag}
                                            selected={tags.includes(tag)}
                                            onPress={() => toggleTag(tag)}
                                        />
                                    ))}
                                </View>

                            </View>
                        </ScrollView>
                    </View>

                    {/* Footer button */}
                    <View style={styles.footer}>
                        <Button
                            onPress={handleSave}
                            size="xl"
                            variant="primary"
                            disabled={!isValid}
                            icon={
                                <Feather
                                    name="plus"
                                    size={20}
                                    style={styles.addIcon}
                                />
                            }
                        >
                            Add Recipe
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
        paddingVertical: theme.spacing.lg,
    },
    content: {
        flex: 1,
    },

    scrollContent: {
        paddingBottom: theme.spacing.xl,
    },

    /* Back */
    backWrapper: {
        marginBottom: theme.spacing.md,
    },
    backButton: {
        paddingHorizontal: 0,
        alignSelf: 'flex-start',
    },
    backText: {
        fontFamily: theme.fontFamily.medium,
        fontSize: theme.fontSize.sm,
        color: theme.colors.mutedForeground,
    },
    backIcon: {
        color: theme.colors.mutedForeground,
    },

    /* Header */
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

    /* Fields */
    fieldGroup: {
        marginBottom: theme.spacing.lg,
    },
    fieldLabel: {
        fontFamily: theme.fontFamily.medium,
        fontSize: theme.fontSize.sm,
        color: theme.colors.foreground,
        marginBottom: theme.spacing.sm,
    },

    inputWrapper: {
        borderWidth: 2,
        borderColor: theme.colors.border,
        borderRadius: theme.radii.xl,
        backgroundColor: theme.colors.card,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
    },
    textAreaWrapper: {
        borderWidth: 2,
        borderColor: theme.colors.border,
        borderRadius: theme.radii.xl,
        backgroundColor: theme.colors.card,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        minHeight: 140,
    },
    inputWrapperFocused: {
        borderColor: theme.colors.primary,
    },

    input: {
        fontFamily: theme.fontFamily.regular,
        fontSize: theme.fontSize.base,
        lineHeight: theme.lineHeight.base,
        color: theme.colors.foreground,
    },
    textArea: {
        flex: 1,
        fontFamily: theme.fontFamily.regular,
        fontSize: theme.fontSize.base,
        lineHeight: theme.lineHeight.base,
        color: theme.colors.foreground,
    },
    inputPlaceholder: {
        color: theme.colors.mutedForeground,
    },

    /* Tags */
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
    },

    /* Footer */
    footer: {
        marginTop: theme.spacing.md,
    },
    addIcon: {
        color: theme.colors.primaryForeground,
    },

    /* Complete state */
    centeredContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: theme.spacing.lg,
    },
    completeCheckCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing.lg,
    },
    completeCheckIcon: {
        color: theme.colors.primaryForeground,
    },
    completeTextBlock: {
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    completeTitle: {
        fontFamily: theme.fontFamily.semibold,
        fontSize: theme.fontSize.xl,
        color: theme.colors.foreground,
        marginBottom: theme.spacing.xs,
    },
    completeSubtitle: {
        fontFamily: theme.fontFamily.regular,
        fontSize: theme.fontSize.sm,
        color: theme.colors.mutedForeground,
    },
    previewCard: {
        width: '100%',
        maxWidth: 320,
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        borderRadius: theme.radii.xl,
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.border,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 2,
    },
    previewEmojiWrapper: {
        width: 48,
        height: 48,
        borderRadius: theme.radii.lg,
        backgroundColor: theme.colors.sageLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing.md,
    },
    previewEmoji: {
        fontSize: 24,
    },
    previewTextWrapper: {
        flex: 1,
    },
    previewTitle: {
        fontFamily: theme.fontFamily.medium,
        fontSize: theme.fontSize.sm,
        color: theme.colors.foreground,
        marginBottom: 2,
    },
    previewMeta: {
        fontFamily: theme.fontFamily.regular,
        fontSize: theme.fontSize.xs,
        color: theme.colors.mutedForeground,
    },
    previewSparkles: {
        color: theme.colors.primary,
        marginLeft: theme.spacing.sm,
    },

    /* Saving state */
    savingCircleWrapper: {
        width: 96,
        height: 96,
        borderRadius: 48,
        borderWidth: 4,
        borderColor: theme.colors.sageLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing.lg,
    },
    savingSpinner: {
        color: theme.colors.primary,
    },
    savingSparkles: {
        position: 'absolute',
        color: theme.colors.primary,
    },
    savingTitle: {
        fontFamily: theme.fontFamily.semibold,
        fontSize: theme.fontSize.lg,
        color: theme.colors.foreground,
        marginBottom: theme.spacing.xs,
    },
    savingSubtitle: {
        fontFamily: theme.fontFamily.regular,
        fontSize: theme.fontSize.sm,
        color: theme.colors.mutedForeground,
    },
}));
