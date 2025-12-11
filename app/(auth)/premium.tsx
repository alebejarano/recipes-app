// app/(auth)/premium.tsx
import React from 'react';
import { useRouter } from 'expo-router';

import PremiumScreen from '@/features/subscription/screens/PremiumScreen';

export default function PremiumRoute() {
    const router = useRouter();

    const handleUpgrade = async () => {
        // TODO: integrate real billing / checkout here
        // After successful upgrade, send the user back to the app tabs
        // router.replace('/(auth)/(tabs)');
    };

    const handleMaybeLater = () => {
        // For now: go back or to Home
        router.back();
        // Or if you prefer:
        // router.replace('/(auth)/(tabs)');
    };

    return (
        <PremiumScreen
            onUpgrade={handleUpgrade}
            onMaybeLater={handleMaybeLater}
        />
    );
}
