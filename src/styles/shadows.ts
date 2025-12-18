export const shadows = {
    soft: {
        shadowColor: 'rgba(178, 178, 178, 0.05)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 5, // ~20px blur
        elevation: 2,
    },
    medium: {
        shadowColor: 'rgba(63, 50, 40, 0.12)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 15, // ~30px blur
        elevation: 8,
    },
    elevated: {
        shadowColor: 'rgba(63, 50, 40, 0.15)',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 1,
        shadowRadius: 25, // ~50px blur
        elevation: 14,
    },
} as const;

export type ShadowTokens = typeof shadows;
