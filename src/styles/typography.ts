
export const fontFamily = {
    regular: 'PlusJakartaSans-Regular',
    medium: 'PlusJakartaSans-Medium',
    semibold: 'PlusJakartaSans-SemiBold',
    bold: 'PlusJakartaSans-Bold',
} as const;

export const fontSize = {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    display: 28,
    hero: 32,
} as const;

export const lineHeight = {
    xs: 16,
    sm: 20,
    base: 24,
    lg: 26,
    xl: 28,
    xxl: 32,
    display: 36,
    hero: 40,
} as const;

export const fontWeight = {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
} as const;

export const textVariants = {
    heroTitle: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.hero,
        lineHeight: lineHeight.hero,
        fontWeight: fontWeight.bold as any,
    },
    onboardingTitle: {
        fontFamily: fontFamily.semibold,
        fontSize: fontSize.display,
        lineHeight: lineHeight.display,
        fontWeight: fontWeight.semibold as any,
    },
    onboardingHighlight: {
        fontFamily: fontFamily.semibold,
        fontSize: fontSize.display,
        lineHeight: lineHeight.display,
        fontWeight: fontWeight.semibold as any,
    },
    body: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.base,
        lineHeight: lineHeight.base,
        fontWeight: fontWeight.regular as any,
    },
    bodyMuted: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.base,
        lineHeight: lineHeight.base,
        fontWeight: fontWeight.regular as any,
    },
    caption: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.sm,
        lineHeight: lineHeight.sm,
        fontWeight: fontWeight.regular as any,
    },
    buttonLabel: {
        fontFamily: fontFamily.semibold,
        fontSize: fontSize.base,
        lineHeight: lineHeight.base,
        fontWeight: fontWeight.semibold as any,
    },
    smallButtonLabel: {
        fontFamily: fontFamily.medium,
        fontSize: fontSize.sm,
        lineHeight: lineHeight.sm,
        fontWeight: fontWeight.medium as any,
    },
} as const;

export type FontSizeTokens = typeof fontSize;
export type LineHeightTokens = typeof lineHeight;
export type FontWeightTokens = typeof fontWeight;
export type TextVariantTokens = typeof textVariants;
