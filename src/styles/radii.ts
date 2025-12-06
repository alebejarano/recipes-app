export const radii = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,   // cards / big buttons
    pill: 999,
    full: 9999,
} as const;

export type RadiusTokens = typeof radii;
