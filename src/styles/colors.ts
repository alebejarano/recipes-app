// styles/colors.ts

export type ColorMode = 'light' | 'dark';

export const lightColors = {
    background: 'hsla(37, 50%, 94%, 1.00)',
    foreground: 'hsl(30 15% 20%)',

    card: 'hsl(45 25% 99%)',
    cardForeground: 'hsl(30 15% 20%)',

    popover: 'hsl(45 25% 99%)',
    popoverForeground: 'hsl(30 15% 20%)',

    primary: 'hsl(142 25% 45%)',
    primaryForeground: 'hsl(45 30% 98%)',

    secondary: 'hsl(35 30% 92%)',
    secondaryForeground: 'hsl(30 15% 30%)',

    muted: 'hsl(142 15% 92%)',
    mutedForeground: 'hsl(30 10% 50%)',

    accent: 'hsl(18 50% 65%)',
    accentForeground: 'hsl(45 30% 98%)',

    destructive: 'hsl(0 60% 55%)',
    destructiveForeground: 'hsl(45 30% 98%)',

    border: 'hsl(35 20% 88%)',
    input: 'hsl(35 20% 88%)',
    inputBackground: 'hsl(35 25% 90%)',
    ring: 'hsl(142 25% 45%)',

    sage: 'hsl(142 25% 45%)',
    sageLight: 'hsl(142 20% 92%)',
    sageDark: 'hsl(142 30% 35%)',

    primarySoft: 'hsl(142 20% 92%)',
    primaryDark: 'hsl(143, 39%, 25%)',

    cream: 'hsla(37, 50%, 94%, 1.00)',
    creamDark: 'hsl(35 25% 90%)',

    terracotta: 'hsl(18 50% 65%)',
    terracottaLight: 'hsl(18 45% 85%)',

    peach: 'hsl(25 60% 90%)',
    warmGray: 'hsl(30 10% 50%)',

    sidebarBackground: 'hsl(45 30% 97%)',
    sidebarForeground: 'hsl(30 15% 20%)',
    sidebarPrimary: 'hsl(142 25% 45%)',
    sidebarPrimaryForeground: 'hsl(45 30% 98%)',
    sidebarAccent: 'hsl(35 30% 92%)',
    sidebarAccentForeground: 'hsl(30 15% 30%)',
    sidebarBorder: 'hsl(35 20% 88%)',
    sidebarRing: 'hsl(142 25% 45%)',

    success: 'hsl(81,95%,26%)',

} as const;

export const darkColors = {
    background: 'hsl(30 15% 10%)',
    foreground: 'hsl(45 20% 92%)',

    card: 'hsl(30 15% 12%)',
    cardForeground: 'hsl(45 20% 92%)',

    popover: 'hsl(30 15% 12%)',
    popoverForeground: 'hsl(45 20% 92%)',

    primary: 'hsl(142 25% 55%)',
    primaryForeground: 'hsl(30 15% 10%)',

    secondary: 'hsl(30 15% 18%)',
    secondaryForeground: 'hsl(45 20% 92%)',

    muted: 'hsl(30 15% 18%)',
    mutedForeground: 'hsl(45 15% 60%)',

    accent: 'hsl(18 45% 55%)',
    accentForeground: 'hsl(45 30% 98%)',

    destructive: 'hsl(0 55% 45%)',
    destructiveForeground: 'hsl(45 30% 98%)',

    border: 'hsl(30 15% 22%)',
    input: 'hsl(30 15% 22%)',
    inputBackground: 'hsl(30 15% 18%)',
    ring: 'hsl(142 25% 55%)',

    sage: 'hsl(142 25% 55%)',
    sageLight: 'hsl(142 15% 20%)',
    sageDark: 'hsl(142 30% 65%)',

    primarySoft: 'hsl(142 15% 20%)',

    cream: 'hsl(30 15% 10%)',
    creamDark: 'hsl(30 15% 15%)',

    terracotta: 'hsl(18 45% 55%)',
    terracottaLight: 'hsl(18 30% 25%)',

    peach: 'hsl(25 40% 20%)',
    warmGray: 'hsl(30 10% 60%)',

    sidebarBackground: 'hsl(30 15% 10%)',
    sidebarForeground: 'hsl(45 20% 92%)',
    sidebarPrimary: 'hsl(142 25% 55%)',
    sidebarPrimaryForeground: 'hsl(30 15% 10%)',
    sidebarAccent: 'hsl(30 15% 18%)',
    sidebarAccentForeground: 'hsl(45 20% 92%)',
    sidebarBorder: 'hsl(30 15% 22%)',
    sidebarRing: 'hsl(142 25% 55%)',

    success: 'hsl(101,78%,41%)',
} as const;

// KEY: widen the value types from string literals → string
export type ColorName = keyof typeof lightColors;
export type ColorTokens = Record<ColorName, string>;
