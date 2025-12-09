// src/components/Button.tsx
import React from 'react';
import {
    Text,
    TouchableOpacity,
    View,
    StyleProp,
    ViewStyle,
    TextStyle,
} from 'react-native';
import { createThemedStyles } from '@/styles/createStyles';

interface ButtonProps {
    children: React.ReactNode;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'soft' | 'accent' | 'ghost';
    size?: 'md' | 'lg' | 'xl';
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    icon?: React.ReactNode; // For Apple / Google icons
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
            activeOpacity={disabled ? 1 : 0.8}
            disabled={disabled}
            style={[
                styles.base,
                styles[`size_${size}`],
                styles[variant],
                disabled && styles.disabled,
                disabled && styles[`disabled_${variant}`],
                style,
            ]}
        >
            {icon && <View style={styles.icon}>{icon}</View>}
            <Text
                style={[
                    styles.textBase,
                    styles[`text_${variant}`],
                    disabled && styles.textDisabled,
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
        borderRadius: 999,
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
        backgroundColor: theme.colors.muted,
    },
    accent: {
        backgroundColor: theme.colors.accent,
    },
    ghost: {
        backgroundColor: 'transparent',
    },

    /* ===== Disabled tweaks ===== */
    disabled: {
        opacity: 0.9,
    },
    disabled_primary: {
        backgroundColor: theme.colors.sageLight, // softer green from your palette
        shadowOpacity: 0,
        elevation: 0,
    },
    disabled_secondary: {},
    disabled_soft: {},
    disabled_accent: {},
    disabled_ghost: {},

    /* ======= Text ======= */
    textBase: {
        fontFamily: theme.fontFamily.medium,
        fontSize: theme.fontSize.lg,
    },
    text_primary: {
        color: theme.colors.primaryForeground,
    },
    text_secondary: {
        color: theme.colors.foreground,
    },
    text_soft: {
        color: theme.colors.foreground,
    },
    text_accent: {
        color: theme.colors.accentForeground,
    },
    text_ghost: {
        color: theme.colors.mutedForeground,
    },
    textDisabled: {
        // keep color but slightly softer; combined with container opacity
        opacity: 0.9,
    },

    /* ===== Icon Wrapper ===== */
    icon: {
        marginRight: theme.spacing.sm,
    },
}));
