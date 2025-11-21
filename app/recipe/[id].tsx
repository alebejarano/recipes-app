import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, spacing, borderRadius, fontSize, fontWeight, iconSize } from '../../constants/theme';

export default function RecipeDetailScreen() {
    const { id } = useLocalSearchParams();

    // TODO: Fetch recipe from storage/database using id
    // For now, using sample data
    const recipe = {
        id: id,
        title: 'Chocolate Chip Cookies',
        content: `## Ingredients
- 2 1/4 cups all-purpose flour
- 1 tsp baking soda
- 1 tsp salt
- 1 cup butter, softened
- 3/4 cup granulated sugar
- 3/4 cup packed brown sugar
- 2 large eggs
- 2 tsp vanilla extract
- 2 cups chocolate chips

## Instructions
1. Preheat oven to 375°F (190°C)
2. Mix flour, baking soda and salt in a bowl
3. Beat butter and sugars until creamy
4. Add eggs and vanilla, beat well
5. Gradually blend in flour mixture
6. Stir in chocolate chips
7. Drop rounded tablespoons onto ungreased cookie sheets
8. Bake 9-11 minutes or until golden brown
9. Cool on baking sheet for 2 minutes
10. Remove to wire rack to cool completely

Enjoy your delicious homemade cookies!`,
        tags: ['dessert', 'quick', 'easy'],
        createdAt: '2024-11-20',
    };

    const handleEdit = () => {
        // TODO: Navigate to edit screen
        console.log('Edit recipe:', id);
        // router.push(`/recipe/edit/${id}`);
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Recipe',
            'Are you sure you want to delete this recipe?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        // TODO: Delete recipe from storage
                        console.log('Deleting recipe:', id);
                        router.back();
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={iconSize.lg} color={colors.textPrimary} />
                </TouchableOpacity>

                <View style={styles.headerActions}>
                    <TouchableOpacity onPress={handleEdit} style={styles.iconButton}>
                        <Ionicons name="pencil" size={iconSize.md} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleDelete} style={styles.iconButton}>
                        <Ionicons name="trash-outline" size={iconSize.md} color={colors.accent} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Title */}
                <Text style={styles.title}>{recipe.title}</Text>

                {/* Tags */}
                {recipe.tags && recipe.tags.length > 0 && (
                    <View style={styles.tagsContainer}>
                        {recipe.tags.map((tag, index) => (
                            <View key={index} style={styles.tag}>
                                <Text style={styles.tagText}>{tag}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Date */}
                <Text style={styles.date}>Created: {recipe.createdAt}</Text>

                {/* Content */}
                <View style={styles.contentContainer}>
                    <Text style={styles.content}>{recipe.content}</Text>
                </View>
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
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButton: {
        padding: spacing.sm,
    },
    headerActions: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    iconButton: {
        padding: spacing.sm,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: spacing.lg,
    },
    title: {
        fontSize: fontSize.xxl,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
        marginBottom: spacing.md,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    tag: {
        backgroundColor: colors.border,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
    },
    tagText: {
        fontSize: fontSize.sm,
        color: colors.secondaryMutedText,
        fontWeight: fontWeight.medium,
    },
    date: {
        fontSize: fontSize.sm,
        color: colors.secondaryMutedText,
        marginBottom: spacing.lg,
    },
    contentContainer: {
        backgroundColor: colors.cardBg,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    content: {
        fontSize: fontSize.md,
        color: colors.textPrimary,
        lineHeight: 24,
    },
});
