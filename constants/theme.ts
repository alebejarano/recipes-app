// Design System for Recipe App

export const colors = {
    bg: 'hsl(28, 21%, 12%)',
    cardBg: 'hsl(26, 19%, 14%)',
    border: 'hsl(25, 15%, 22%)',
    accent: 'hsl(31, 86%, 67%)',
    secondaryMutedText: 'hsl(24, 15%, 67%)',
    textPrimary: 'hsl(30, 15%, 92%)',
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

export const borderRadius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    round: 999,
};

export const fontSize = {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
    xxl: 32,
};

export const fontWeight = {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
};

export const iconSize = {
    sm: 20,
    md: 24,
    lg: 28,
    xl: 32,
};

export const shadows = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 2,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 4,
    },
};
