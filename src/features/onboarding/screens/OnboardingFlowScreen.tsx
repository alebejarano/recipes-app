// src/features/onboarding/screens/OnboardingFlowScreen.tsx

import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

import OnboardingLayout from '@/features/onboarding/components/OnboardingLayout';
import WelcomeScreen from '@/features/onboarding/screens/WelcomeScreen';
import IdentityScreen from '@/features/onboarding/screens/IdentityScreen';
import SpaceReadyScreen from '@/features/onboarding/screens/SpaceReadyScreen';
import ImportSourcesScreen from '@/features/onboarding/screens/ImportSourcesScreen';
import MagicMomentScreen from '@/features/onboarding/screens/MagicMomentScreen';
import AddRecipeScreen from '@/features/onboarding/screens/AddRecipeScreen';
import CreateRecipeScreen from '@/features/onboarding/screens/CreateRecipeScreen';

type OnboardingPath = 'a' | 'b' | null;

// Path A: Welcome → Identity → SpaceReady → AddRecipe → CreateRecipe → Register
// Path B: Welcome → Identity → SpaceReady → ImportSources → MagicMoment → CreateRecipe → Register

export default function OnboardingFlowScreen() {
    const router = useRouter();

    const [step, setStep] = useState(0);
    const [path, setPath] = useState<OnboardingPath>(null);

    // A: choose "Add recipe"
    const handleAddRecipePath = () => {
        setPath('a');
        setStep(3); // AddRecipeScreen
    };

    // B: choose "Skip for now" (import sources)
    const handleSkipPath = () => {
        setPath('b');
        setStep(3); // ImportSourcesScreen
    };

    const goToRegister = () => {
        // After completing the path and saving the first recipe,
        // we send them to the Register screen.
        router.replace('/register');
    };

    const handleRecipeSaved = () => {
        // In the old web flow, this is where you did:
        // - first recipe → Account screen
        // - 5 recipes → Premium
        //
        // With the new architecture:
        // - Onboarding ends here
        // - Account creation + premium gating happens in the authenticated app
        goToRegister();
    };

    const renderScreen = () => {
        // Common screens (0–2)
        if (step === 0) {
            return <WelcomeScreen onContinue={() => setStep(1)} />;
        }

        if (step === 1) {
            return <IdentityScreen onContinue={() => setStep(2)} />;
        }

        if (step === 2) {
            return (
                <SpaceReadyScreen
                    onAddRecipe={handleAddRecipePath}
                    onSkip={handleSkipPath}
                />
            );
        }

        // Path A: AddRecipe → CreateRecipe → Register
        if (path === 'a') {
            switch (step) {
                case 3:
                    return (
                        <AddRecipeScreen
                            onSelectManual={() => setStep(4)}
                            // if you also have an "import" in path A later, add more callbacks here
                        />
                    );
                case 4:
                    return (
                        <CreateRecipeScreen
                            onSave={handleRecipeSaved}
                            onBack={() => setStep(3)}
                        />
                    );
                default:
                    return <WelcomeScreen onContinue={() => setStep(1)} />;
            }
        }

        // Path B: ImportSources → MagicMoment → CreateRecipe → Register
        if (path === 'b') {
            switch (step) {
                case 3:
                    return (
                        <ImportSourcesScreen
                            onContinue={() => setStep(4)}
                        />
                    );
                case 4:
                    return (
                        <MagicMomentScreen
                            onAddRecipe={() => setStep(5)}
                            onGoHome={goToRegister} // if they skip, still drive them to registration
                        />
                    );
                case 5:
                    return (
                        <CreateRecipeScreen
                            onSave={handleRecipeSaved}
                        />
                    );
                default:
                    return <WelcomeScreen onContinue={() => setStep(1)} />;
            }
        }

        // Fallback before path is selected
        return <WelcomeScreen onContinue={() => setStep(1)} />;
    };

    const getProgress = () => {
        // Simple linear progress for layout.
        // You can tweak numbers if you want more granular steps.

        if (path === 'a') {
            // Steps: 0 (Welcome), 1 (Identity), 2 (SpaceReady), 3 (AddRecipe), 4 (CreateRecipe)
            const totalSteps = 5;
            return { current: step + 1, total: totalSteps };
        }

        if (path === 'b') {
            // Steps: 0 (Welcome), 1 (Identity), 2 (SpaceReady), 3 (ImportSources),
            //        4 (MagicMoment), 5 (CreateRecipe)
            const totalSteps = 6;
            return { current: step + 1, total: totalSteps };
        }

        // Before user chooses path: we only have 3 visible steps
        const totalSteps = 3;
        return { current: step + 1, total: totalSteps };
    };

    const { current, total } = getProgress();

    // Wrap all onboarding steps in your OnboardingLayout
    return (
        <OnboardingLayout step={current} totalSteps={total}>
            <View style={{ flex: 1 }}>{renderScreen()}</View>
        </OnboardingLayout>
    );
}
