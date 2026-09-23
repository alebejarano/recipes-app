// styles/createStyles.ts
import { StyleSheet } from 'react-native';
import { theme, Theme } from './theme';

type ThemedStyles = StyleSheet.NamedStyles<any>;

const registeredStyles = new Set<{
    styles: ThemedStyles;
    factory: (theme: Theme) => ThemedStyles;
}>();

export function createThemedStyles<
    T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>
>(factory: (theme: Theme) => T): T {
    // Do not use StyleSheet.create here: its registered styles are immutable,
    // while the app supports changing its appearance at runtime.
    const styles = factory(theme);
    registeredStyles.add({ styles, factory });
    return styles;
}

/** Refresh the existing style objects after the active theme changes. */
export function refreshThemedStyles(activeTheme: Theme) {
    registeredStyles.forEach(({ styles, factory }) => {
        const nextStyles = factory(activeTheme);
        Object.keys(styles).forEach((key) => delete styles[key]);
        Object.assign(styles, nextStyles);
    });
}
