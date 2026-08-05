import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { useCreateLocalRecipe } from '@/features/recipes/hooks/useLocalRecipes';
import type { LocalRecipe } from '@/features/recipes/storage/localRecipesStorage';
import { createLocalRecipe } from '@/features/recipes/storage/localRecipesStorage';
import { triggerRecipeSync } from '@/features/recipes/sync/recipeSync';

jest.mock('@/features/recipes/storage/localRecipesStorage', () => ({
    createLocalRecipe: jest.fn(),
}));

jest.mock('@/features/storage/context/StorageStrategyContext', () => ({
    useStorageStrategy: () => ({ isPremium: false }),
}));

jest.mock('@/features/recipes/sync/recipeSync', () => ({
    triggerRecipeSync: jest.fn(),
}));

const createdRecipe: LocalRecipe = {
    id: 'recipe-1',
    title: 'Pasta primavera',
    subtitle: null,
    description: null,
    emoji: '🍝',
    imageUrl: null,
    steps: ['Cook the pasta'],
    ingredients: [],
    folders: [],
    mealTimes: ['dinner'],
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    servings: 2,
    createdAt: '2026-08-05T12:00:00.000Z',
    updatedAt: '2026-08-05T12:00:00.000Z',
};

describe('local recipe creation', () => {
    beforeEach(() => {
        jest.mocked(createLocalRecipe).mockResolvedValue(createdRecipe);
        jest.mocked(triggerRecipeSync).mockResolvedValue();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('creates a free local recipe, refreshes the list, and queues sync', async () => {
        const queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
                mutations: { retry: false },
            },
        });
        const invalidateQueries = jest.spyOn(queryClient, 'invalidateQueries');
        const wrapper = ({ children }: PropsWithChildren) => (
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        );
        const { result, unmount } = await renderHook(() => useCreateLocalRecipe(), { wrapper });
        let recipe: LocalRecipe | undefined;

        await act(async () => {
            recipe = await result.current.mutateAsync({
                title: 'Pasta primavera',
                subtitle: null,
                description: null,
                emoji: '🍝',
                imageUrl: null,
                prepTimeMinutes: 10,
                cookTimeMinutes: 15,
                servings: 2,
                ingredients: ['Pasta'],
                steps: ['Cook the pasta'],
                folders: ['Dinner'],
                mealTimes: ['dinner'],
            });
        });

        expect(recipe).toBe(createdRecipe);
        expect(createLocalRecipe).toHaveBeenCalledWith(
            expect.objectContaining({ title: 'Pasta primavera' }),
            { plan: 'free' }
        );
        expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['recipes', 'local', 'list'] });
        expect(triggerRecipeSync).toHaveBeenCalledTimes(1);

        unmount();
        queryClient.clear();
    });
});
