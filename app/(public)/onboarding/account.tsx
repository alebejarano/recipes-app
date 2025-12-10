// app/(public)/onboarding/account.tsx
import React from 'react';
import { useRouter } from 'expo-router';

import RegisterScreen, {
    RegisterMethod,
} from '@/features/auth/screens/RegisterScreen';

export default function OnboardingAccountRoute() {
    const router = useRouter();

    const handleContinue = async (method: RegisterMethod) => {
        // TODO: onboarding-specific tracking or state updates here.
        // For now we just send them to the main app after sign-up.
        // router.replace('/(app)/(tabs)');
    };

    return (
        <RegisterScreen
            onContinue={handleContinue}
            showSuccessMessage={true}
        />
    );
}
