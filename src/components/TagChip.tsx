// src/components/TagChip.tsx
import React from 'react';
import { Pressable, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { createThemedStyles } from '@/styles/createStyles';

interface TagChipProps {
    label: string;
    selected?: boolean;
    onPress: () => void;
}

export default function TagChip({
                                    label,
                                    selected = false,
                                    onPress,
                                }: TagChipProps) {
    return (
        <Pressable
            onPress={onPress}
            style={[
                styles.base,
                selected ? styles.selected : styles.unselected,
            ]}
        >
            <Text
                style={[
                    styles.text,
                    selected && styles.textSelected,
                ]}
            >
                {label}
            </Text>

            {selected && (
                <Feather
                    name="x"
                    size={12}
                    style={styles.icon}
                />
            )}
        </Pressable>
    );
}

const styles = createThemedStyles(theme => ({
    base: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start', // ← critical
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.radii.full,
    },

    unselected: {
        backgroundColor: theme.colors.muted,
    },

    selected: {
        backgroundColor: theme.colors.primary,
    },

    text: {
        fontFamily: theme.fontFamily.medium,
        fontSize: theme.fontSize.sm,
        color: theme.colors.mutedForeground,
    },

    textSelected: {
        color: theme.colors.primaryForeground,
    },

    icon: {
        marginLeft: theme.spacing.xs,
        color: theme.colors.primaryForeground,
    },
}));
