// src/components/Button.tsx
import { createThemedStyles } from '@/styles/createStyles';
import React from 'react';
import {
    StyleProp,
    Text,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'soft' | 'accent' | 'ghost' | 'premium';
type ButtonSize = 'md' | 'lg' | 'xl';

interface ButtonProps {
    children: React.ReactNode;
    onPress: () => void;
    variant?: ButtonVariant;
    size?: ButtonSize;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    icon?: React.ReactNode;
    disabled?: boolean;
}

export default function Button({
                                   children,
                                   onPress,
                                   variant = 'primary',
                                   size = 'lg',
                                   icon,
                                   style,
                                   textStyle,
                                   disabled = false,
                               }: ButtonProps) {
    return (
        <TouchableOpacity
            onPress={disabled ? undefined : onPress}
            activeOpacity={disabled ? 1 : 0.85}
            disabled={disabled}
            style={[
                styles.base,
                styles[`size_${size}`],

                // normal variant
                !disabled && styles[variant],

                // disabled variant (solid, no fading)
                disabled && styles[`disabled_${variant}`],

                style,
            ]}
        >
            {icon && <View style={styles.icon}>{icon}</View>}

            <Text
                style={[
                    styles.textBase,
                    !disabled ? styles[`text_${variant}`] : styles[`textDisabled_${variant}`],
                    textStyle,
                ]}
            >
                {children}
            </Text>
        </TouchableOpacity>
    );
}

const styles = createThemedStyles(theme => ({
    base: {
        width: '100%',
        borderRadius: theme.radii.xl,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.sm,
    },

    /* ===== Sizes ===== */
    size_md: {
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.lg,
    },
    size_lg: {
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.xl,
    },
    size_xl: {
        paddingVertical: theme.spacing.lg,
        paddingHorizontal: theme.spacing.xl,
    },

    /* ===== Variants (normal) ===== */
    primary: {
        backgroundColor: theme.colors.primary,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    secondary: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    soft: {
        backgroundColor: theme.colors.creamDark,
    },
    accent: {
        backgroundColor: theme.colors.accent,
    },
    ghost: {
        backgroundColor: 'transparent',
    },
    premium: {
        backgroundColor: theme.colors.terracotta,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
    },

    /* ===== Disabled (solid, not transparent) ===== */
    disabled_primary: {
        backgroundColor: theme.colors.primary,
        opacity: 0.5,
        shadowOpacity: 0,
        elevation: 0,
    },
    disabled_secondary: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: theme.colors.border,
        opacity: 0.7, // optional: only affects border, still looks OK
    },
    disabled_soft: {
        backgroundColor: theme.colors.muted,
    },
    disabled_accent: {
        backgroundColor: theme.colors.accent,
        opacity: 0.85, // optional
    },
    disabled_ghost: {
        backgroundColor: 'transparent',
    },
    disabled_premium: {
        backgroundColor: theme.colors.terracotta, // keep solid
        shadowOpacity: 0,
        elevation: 0,
        opacity: 0.85, // optional
    },

    /* ===== Text ===== */
    textBase: {
        fontFamily: theme.fontFamily.medium,
        fontSize: theme.fontSize.lg,
    },
    text_primary: { color: theme.colors.primaryForeground },
    text_secondary: { color: theme.colors.foreground },
    text_soft: { color: theme.colors.foreground },
    text_accent: { color: theme.colors.accentForeground },
    text_ghost: { color: theme.colors.mutedForeground },
    text_premium: { color: theme.colors.accentForeground },

    // Disabled text per variant (no global opacity wash-out)
    textDisabled_primary: { color: theme.colors.primaryForeground },
    textDisabled_secondary: { color: theme.colors.mutedForeground },
    textDisabled_soft: { color: theme.colors.mutedForeground },
    textDisabled_accent: { color: theme.colors.accentForeground },
    textDisabled_ghost: { color: theme.colors.mutedForeground },
    textDisabled_premium: { color: theme.colors.accentForeground },

    /* ===== Icon Wrapper ===== */
    icon: {
        marginRight: theme.spacing.sm,
    },
}));
