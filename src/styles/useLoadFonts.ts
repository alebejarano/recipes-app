// src/styles/useLoadFonts.ts
import { useFonts } from 'expo-font';

export function useLoadFonts() {
    const [loaded] = useFonts({
        'PlusJakartaSans': require('../../assets/fonts/PlusJakartaSans-Variable.ttf'),
    });

    return loaded;
}
