import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    StatusBar,
    FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, spacing, borderRadius, fontSize, fontWeight, iconSize } from '../constants/theme';
import Card from '../components/Card';

export default function RecipesScreen() {
    const [searchQuery, setSearchQuery] = useState('');

    // Sample data - later replace with actual data from storage/database
    const [recipes, setRecipes] = useState([
        {
            id: '1',
            title: 'Chocolate Chip Cookies',
            content: 'Delicious homemade cookies with chocolate chips. Perfect for a quick snack or dessert.',
            tags: ['dessert', 'quick', 'easy'],
        },
        {
            id: '2',
            title: 'Spaghetti Carbonara',
            content: 'Classic Italian pasta dish with eggs, cheese, and crispy bacon.',
            tags: ['italian', 'pasta', 'dinner'],
        },
    ]);

    const handleRecipePress = (id: string) => {
        router.push(`/recipe/${id}`);
    };

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

            {/* Conditional: Empty State or Recipe List */}
            {recipes.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No recipes yet</Text>

                    <TouchableOpacity
                        style={styles.addRecipeButton}
                        onPress={() => router.push('/add')}
                    >
                        <Ionicons name="add" size={iconSize.md} color={colors.bg} />
                        <Text style={styles.addRecipeButtonText}>Add recipe</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={recipes}
                    renderItem={({ item }) => (
                        <Card
                            title={item.title}
                            content={item.content}
                            tags={item.tags}
                            onPress={() => handleRecipePress(item.id)}
                        />
                    )}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
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
    listContent: {
        padding: spacing.lg,
    },
});
