// src/features/subscription/hooks/useFeatureAccess.ts

// TODO: You would wrap this provider in your (auth) layout so all authenticated screens
//  (including Home, AddRecipe, Premium) can use useFeatureAccess().

import { useContext, useMemo } from 'react';
import { SubscriptionContext } from '../context/SubscriptionContext';

export function useFeatureAccess() {
    const { plan, recipesCount, maxFreeRecipes } = useContext(SubscriptionContext);

    const {
        isPremium,
        canAddRecipe,
        reachedFreeLimit,
        remainingFreeRecipes,
    } = useMemo(() => {
        const isPremium = plan === 'premium';
        const remaining = Math.max(0, maxFreeRecipes - recipesCount);
        const canAddRecipe = isPremium || recipesCount < maxFreeRecipes;
        const reachedFreeLimit = !isPremium && !canAddRecipe;

        return {
            isPremium,
            canAddRecipe,
            reachedFreeLimit,
            remainingFreeRecipes: remaining,
        };
    }, [plan, recipesCount, maxFreeRecipes]);

    return {
        isPremium,
        canAddRecipe,
        reachedFreeLimit,
        remainingFreeRecipes,
    };
}
