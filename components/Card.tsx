import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../constants/theme';

interface CardProps {
    title: string;
    content?: string;
    tags?: string[];
    onPress?: () => void;
}

export default function Card({ title, content, tags, onPress }: CardProps) {
    return (
        <TouchableOpacity
            style={styles.card}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <Text style={styles.title}>{title}</Text>

            {content && (
                <Text style={styles.content} numberOfLines={3}>
                    {content}
                </Text>
            )}

            {tags && tags.length > 0 && (
                <View style={styles.tagsContainer}>
                    {tags.map((tag, index) => (
                        <View key={index} style={styles.tag}>
                            <Text style={styles.tagText}>{tag}</Text>
                        </View>
                    ))}
                </View>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.cardBg,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    title: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.semibold,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
    content: {
        fontSize: fontSize.md,
        color: colors.secondaryMutedText,
        lineHeight: 20,
        marginBottom: spacing.sm,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        marginTop: spacing.xs,
    },
    tag: {
        backgroundColor: colors.border,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
    },
    tagText: {
        fontSize: fontSize.xs,
        color: colors.secondaryMutedText,
        fontWeight: fontWeight.medium,
    },
});
