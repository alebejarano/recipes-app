// src/features/subscription/context/SubscriptionContext.tsx
import React, { createContext, useMemo } from 'react';

type Plan = 'free' | 'premium';

type SubscriptionContextValue = {
    plan: Plan;
    recipesCount: number;
    maxFreeRecipes: number;
};

export const SubscriptionContext = createContext<SubscriptionContextValue>({
    plan: 'free',
    recipesCount: 0,
    maxFreeRecipes: 5,
});

type Props = {
    children: React.ReactNode;
    plan: Plan;
    recipesCount: number;
    maxFreeRecipes?: number;
};

export function SubscriptionProvider({
                                         children,
                                         plan,
                                         recipesCount,
                                         maxFreeRecipes = 5,
                                     }: Props) {
    const value = useMemo(
        () => ({ plan, recipesCount, maxFreeRecipes }),
        [plan, recipesCount, maxFreeRecipes],
    );

    return (
        <SubscriptionContext.Provider value={value}>
            {children}
        </SubscriptionContext.Provider>
    );
}
