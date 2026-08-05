import { renderHook } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';
import { SubscriptionContext } from '../../context/SubscriptionContext';
import { useFeatureAccess } from '../useFeatureAccess';

jest.mock('../../context/SubscriptionContext', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createContext } = require('react');
    return {
        SubscriptionContext: createContext({
            plan: 'free',
            recipesCount: 0,
            maxFreeRecipes: 100,
        }),
    };
});

function wrapperFor(value: { plan: 'free' | 'premium'; recipesCount: number; maxFreeRecipes: number }) {
    return function SubscriptionTestWrapper({ children }: PropsWithChildren) {
        return <SubscriptionContext.Provider value={value as never}>{children}</SubscriptionContext.Provider>;
    };
}

describe('useFeatureAccess', () => {
    it('allows free users to add recipes below the limit', async () => {
        const { result } = await renderHook(() => useFeatureAccess(), {
            wrapper: wrapperFor({ plan: 'free', recipesCount: 99, maxFreeRecipes: 100 }),
        });

        expect(result.current).toEqual({
            isPremium: false,
            canAddRecipe: true,
            reachedFreeLimit: false,
            remainingFreeRecipes: 1,
        });
    });

    it('blocks free users at the recipe limit', async () => {
        const { result } = await renderHook(() => useFeatureAccess(), {
            wrapper: wrapperFor({ plan: 'free', recipesCount: 100, maxFreeRecipes: 100 }),
        });

        expect(result.current).toEqual({
            isPremium: false,
            canAddRecipe: false,
            reachedFreeLimit: true,
            remainingFreeRecipes: 0,
        });
    });

    it('allows premium users beyond the free limit', async () => {
        const { result } = await renderHook(() => useFeatureAccess(), {
            wrapper: wrapperFor({ plan: 'premium', recipesCount: 100, maxFreeRecipes: 100 }),
        });

        expect(result.current).toEqual({
            isPremium: true,
            canAddRecipe: true,
            reachedFreeLimit: false,
            remainingFreeRecipes: 0,
        });
    });
});
