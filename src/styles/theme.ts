import { lightColors, darkColors, ColorMode, ColorTokens } from './colors';
import { spacing } from './spacing';
import { radii } from './radii';
import {
    fontFamily,
    fontSize,
    lineHeight,
    fontWeight,
    textVariants,
} from './typography';
import { iconSize } from './icons';
import { shadows } from './shadows';

export type Theme = {
    mode: ColorMode;
    colors: ColorTokens;
    spacing: typeof spacing;
    radii: typeof radii;
    fontFamily: typeof fontFamily;
    fontSize: typeof fontSize;
    lineHeight: typeof lineHeight;
    fontWeight: typeof fontWeight;
    textVariants: typeof textVariants;
    iconSize: typeof iconSize;
    shadows: typeof shadows;
};

export const lightTheme: Theme = {
    mode: 'light',
    colors: lightColors,
    spacing,
    radii,
    fontFamily,
    fontSize,
    lineHeight,
    fontWeight,
    textVariants,
    iconSize,
    shadows,
};

export const darkTheme: Theme = {
    mode: 'dark',
    colors: darkColors,
    spacing,
    radii,
    fontFamily,
    fontSize,
    lineHeight,
    fontWeight,
    textVariants,
    iconSize,
    shadows,
};

// For now, export light as default
export const theme = lightTheme;
