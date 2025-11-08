import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight, iconSize } from '../constants/theme';

export default function RecipesScreen() {
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Recipes</Text>
                <TouchableOpacity style={styles.settingsButton}>
                    <Ionicons name="settings-outline" size={iconSize.lg} color={colors.textPrimary} />
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={iconSize.sm} color={colors.secondaryMutedText} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search recipes..."
                    placeholderTextColor={colors.secondaryMutedText}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* Empty State */}
            <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No recipes yet</Text>

                <TouchableOpacity style={styles.addRecipeButton}>
                    <Ionicons name="add" size={iconSize.md} color={colors.bg} />
                    <Text style={styles.addRecipeButtonText}>Add recipe</Text>
                </TouchableOpacity>
            </View>

            {/* Floating Action Button */}
            <TouchableOpacity style={styles.fab}>
                <Ionicons name="add" size={iconSize.lg} color={colors.bg} />
            </TouchableOpacity>
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
    },
    headerTitle: {
        fontSize: fontSize.xxl,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
    },
    settingsButton: {
        padding: spacing.sm,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.cardBg,
        marginHorizontal: spacing.lg,
        marginTop: spacing.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    searchInput: {
        flex: 1,
        marginLeft: spacing.sm,
        fontSize: fontSize.md,
        color: colors.textPrimary,
        paddingVertical: spacing.sm,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
    },
    emptyStateText: {
        fontSize: fontSize.lg,
        color: colors.secondaryMutedText,
        marginBottom: spacing.xl,
    },
    addRecipeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.accent,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.xl,
        gap: spacing.sm,
    },
    addRecipeButtonText: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.semibold,
        color: colors.bg,
    },
    fab: {
        position: 'absolute',
        bottom: 100,
        right: spacing.lg,
        width: 64,
        height: 64,
        borderRadius: borderRadius.round,
        backgroundColor: colors.accent,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
});
