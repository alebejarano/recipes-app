import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, spacing, borderRadius, fontSize, fontWeight, iconSize } from '../constants/theme';

export default function AddRecipeScreen() {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [tags, setTags] = useState('');

    const handleSave = () => {
        // TODO: Save recipe logic
        console.log('Saving recipe:', { title, content, tags });
        router.back();
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Add Recipe</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                    <Ionicons name="close" size={iconSize.lg} color={colors.textPrimary} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Title Section */}
                <View style={styles.section}>
                    <Text style={styles.label}>Title</Text>
                    <TextInput
                        style={styles.titleInput}
                        placeholder="Recipe name"
                        placeholderTextColor={colors.secondaryMutedText}
                        value={title}
                        onChangeText={setTitle}
                    />
                </View>

                {/* Content Section */}
                <View style={styles.section}>
                    <Text style={styles.label}>Content</Text>
                    <TextInput
                        style={styles.contentInput}
                        placeholder="Write your notes here... (supports Markdown)"
                        placeholderTextColor={colors.secondaryMutedText}
                        value={content}
                        onChangeText={setContent}
                        multiline
                        textAlignVertical="top"
                    />
                </View>

                {/* Tags Section */}
                <View style={styles.section}>
                    <Text style={styles.label}>Tags</Text>
                    <TextInput
                        style={styles.tagsInput}
                        placeholder="quick, healthy, breakfast (comma separate"
                        placeholderTextColor={colors.secondaryMutedText}
                        value={tags}
                        onChangeText={setTags}
                    />
                </View>

                {/* Save Button */}
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                    <Text style={styles.saveButtonText}>Save Recipe</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerTitle: {
        fontSize: fontSize.xxl,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
    },
    closeButton: {
        padding: spacing.sm,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: spacing.lg,
    },
    section: {
        marginBottom: spacing.xl,
    },
    label: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.medium,
        color: colors.textPrimary,
        marginBottom: spacing.md,
    },
    titleInput: {
        backgroundColor: colors.cardBg,
        borderWidth: 2,
        borderColor: colors.accent,
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        fontSize: fontSize.md,
        color: colors.textPrimary,
    },
    contentInput: {
        backgroundColor: colors.cardBg,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        fontSize: fontSize.md,
        color: colors.textPrimary,
        minHeight: 400,
    },
    tagsInput: {
        backgroundColor: colors.cardBg,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        fontSize: fontSize.md,
        color: colors.textPrimary,
    },
    saveButton: {
        backgroundColor: colors.accent,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        marginTop: spacing.md,
        marginBottom: spacing.xxl,
    },
    saveButtonText: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.semibold,
        color: colors.bg,
    },
});
