// styles/createStyles.ts
import { StyleSheet } from 'react-native';
import { theme, Theme } from './theme';

export function createThemedStyles<
    T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>
>(factory: (theme: Theme) => T): T {
    return StyleSheet.create(factory(theme));
}
