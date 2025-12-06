import React from 'react';
import { View } from 'react-native';
import ThemedText from '@/components/ThemedText';
import { useLoadFonts } from '@/styles/useLoadFonts';

export default function Index() {
    const loaded = useLoadFonts();

    if (!loaded) {
        return (
            <View
                style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <ThemedText>Loading fonts…</ThemedText>
            </View>
        );
    }

    return (
        <View
            style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                padding: 24,
            }}
        >
            <ThemedText variant="heroTitle">
                Recipes App
            </ThemedText>

            <ThemedText
                variant="onboardingTitle"
                tone="accent"
                style={{ marginTop: 12 }}
            >
                Plus Jakarta Sans loaded
            </ThemedText>

            <ThemedText
                variant="bodyMuted"
                tone="muted"
                style={{ marginTop: 8, textAlign: 'center' }}
            >
                All font sizes, weights and families come from tokens.textVariants.
            </ThemedText>

            <ThemedText
                variant="buttonLabel"
                tone="success"
                style={{ marginTop: 16 }}
            >
                Button label style
            </ThemedText>
        </View>
    );
}
