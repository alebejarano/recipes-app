// app/(public)/register.tsx
import React from 'react';
import { useRouter } from 'expo-router';

import RegisterScreen, {
    RegisterMethod,
} from '@/features/auth/screens/RegisterScreen';

export default function RegisterRoute() {
    const router = useRouter();

    const handleContinue = async (method: RegisterMethod) => {
        // TODO: plug real auth flow here (Apple / Google / Email)
        // For now, send user to the main app after any successful method.
        // You can branch on `method` if needed.
        // router.replace('/(app)/(tabs)');
    };

    return (
        <RegisterScreen
            onContinue={handleContinue}
            showSuccessMessage={false}
        />
    );
}
