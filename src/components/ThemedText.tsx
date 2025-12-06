import React from 'react';
import {
    Text,
    type TextProps,
    type TextStyle,
    type StyleProp,
} from 'react-native';
import { createThemedStyles } from '@/styles/createStyles';
import type { Tokens } from '@/styles/tokens';
import { textVariants } from '@/styles/typography';

type TextVariant = keyof typeof textVariants;
type TextTone = 'default' | 'muted' | 'accent' | 'danger' | 'success';

export interface ThemedTextProps extends TextProps {
    variant?: TextVariant;
    tone?: TextTone;
    style?: StyleProp<TextStyle>;
}

const useStyles = createThemedStyles((theme: Tokens) => ({
    // Base style applied to all text
    base: {
        color: theme.colors.foreground,
    },

    // === Tone (color) variations ===
    tone_default: {},
    tone_muted: {
        color: theme.colors.mutedForeground,
    },
    tone_accent: {
        color: theme.colors.primary,
    },
    tone_danger: {
        color: theme.colors.destructive,
    },
    tone_success: {
        color: theme.colors.success,
    },

    // === All semantic text variants from tokens ===
    // (heroTitle, onboardingTitle, body, caption, buttonLabel, ...)
    ...theme.textVariants,
}));

export const ThemedText: React.FC<ThemedTextProps> = ({
                                                          variant = 'body',
                                                          tone = 'default',
                                                          style,
                                                          ...rest
                                                      }) => {
    const styles = useStyles();

    const toneKey = `tone_${tone}` as const;

    // textVariants keys (heroTitle, body, buttonLabel, etc.)
    const variantStyle = (styles as any)[variant];
    const toneStyle = (styles as any)[toneKey] ?? null;

    return (
        <Text
            {...rest}
            style={[styles.base, variantStyle, toneStyle, style]}
        />
    );
};

export default ThemedText;
