// styles/colors.ts

export type ColorMode = 'light' | 'dark';

export const lightColors = {
    background: 'hsl(37, 50%, 94%)',
    foreground: 'hsl(30 15% 20%)',

    card: 'hsl(37, 50%, 98%)',
    cardForeground: 'hsl(30 15% 20%)',

    primary: 'hsl(142 25% 45%)',
    primaryForeground: 'hsl(45 30% 98%)',
    primarySoft: 'hsla(142, 15%, 75%, 0.6)',
    primaryDark: 'hsl(143, 39%, 25%)',
    primary10: 'hsla(142, 25%, 45%, 0.10)',
    primary15: 'hsla(142, 25%, 45%, 0.15)',
    primary16: 'hsla(142, 25%, 45%, 0.16)',

    secondary: 'hsl(35 30% 92%)',
    secondaryForeground: 'hsl(30 15% 30%)',

    muted: 'hsl(37, 32%, 92%)',
    mutedForeground: 'hsl(30, 9%, 36%)',

    accent: 'hsl(25,100%,27%)',
    accentLight: 'hsl(25 60% 90%)',
    accentForeground: 'hsl(45 30% 98%)',
    accent10: 'hsla(25, 100%, 27%, 0.10)',

    destructive: 'hsl(0 60% 55%)',
    destructiveForeground: 'hsl(45 30% 98%)',
    danger: 'hsl(0 62% 53%)',

    border: 'hsl(35 20% 88%)',
    input: 'hsl(35 20% 88%)',
    inputBackground: 'hsl(35 25% 90%)',
    ring: 'hsl(142 25% 45%)',

    cream: 'hsla(36, 43%, 92%, 1.00)',
    creamDark: 'hsl(35 25% 90%)',

    terracottaLight: 'hsla(16, 52%, 76%, 0.4)',
    warmGray: 'hsl(30 10% 50%)',

    success: 'hsl(81,95%,26%)',

    shadow: 'hsl(0 0% 0%)',

    overlay: 'hsla(36, 33%, 6%, 0.36)',
    frostedSurface: 'hsla(0, 0%, 100%, 0.7)',

} as const;

export const darkColors = {
    background: 'hsl(30 15% 10%)',
    foreground: 'hsl(45 20% 92%)',

    card: 'hsl(30 15% 12%)',
    cardForeground: 'hsl(45 20% 92%)',

    primary: 'hsl(142 25% 55%)',
    primaryForeground: 'hsl(30 15% 10%)',
    primarySoft: 'hsl(142 15% 20%)',
    primaryDark: 'hsl(142 30% 65%)',
    primary10: 'hsla(142, 25%, 55%, 0.10)',
    primary15: 'hsla(142, 25%, 55%, 0.15)',
    primary16: 'hsla(142, 25%, 55%, 0.16)',

    secondary: 'hsl(30 15% 18%)',
    secondaryForeground: 'hsl(45 20% 92%)',

    muted: 'hsl(30 15% 18%)',
    mutedForeground: 'hsl(45 15% 60%)',

    accent: 'hsl(18 45% 55%)',
    accentLight: 'hsl(25 45% 22%)',
    accentForeground: 'hsl(45 30% 98%)',
    accent10: 'hsla(18, 45%, 55%, 0.10)',

    destructive: 'hsl(0 55% 45%)',
    destructiveForeground: 'hsl(45 30% 98%)',
    danger: 'hsl(0 75% 68%)',

    border: 'hsl(30 15% 22%)',
    input: 'hsl(30 15% 22%)',
    inputBackground: 'hsl(30 15% 18%)',
    ring: 'hsl(142 25% 55%)',

    cream: 'hsl(30 15% 10%)',
    creamDark: 'hsl(30 15% 15%)',

    terracottaLight: 'hsl(18 30% 25%)',
    warmGray: 'hsl(30 10% 60%)',


    success: 'hsl(101,78%,41%)',

    shadow: 'hsl(0 0% 0%)',

    overlay: 'hsla(0, 0%, 0%, 0.6)',
    frostedSurface: 'hsla(0, 0%, 100%, 0.12)',
} as const;

// KEY: widen the value types from string literals → string
export type ColorName = keyof typeof lightColors;
export type ColorTokens = Record<ColorName, string>;
