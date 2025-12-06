import type { ColorTokens } from './colors';
import { lightColors, darkColors } from './colors';
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

export const tokens = {
    lightColors,
    darkColors,
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

export type Tokens = {
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
