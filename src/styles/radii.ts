export const radii = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,   // cards (main)
    xxl: 24,  // modals / big surfaces
    full: 9999,
} as const;

export type RadiusTokens = typeof radii;
