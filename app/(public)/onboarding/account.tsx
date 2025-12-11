// app/(public)/onboarding/account.tsx
import React from 'react';
import AuthScreen from '@/features/auth/screens/AuthScreen';

export default function OnboardingAccountRoute() {
    // We just want the "Create account" mode
    return <AuthScreen initialMode="register" />;
}
