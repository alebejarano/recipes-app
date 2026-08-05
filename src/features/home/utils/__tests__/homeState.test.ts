import {
    buildHomeActivity,
    getHomeCapabilities,
    getRecipeLibraryStage,
} from '../homeState';

describe('getRecipeLibraryStage', () => {
    it.each([
        [-1, 'empty'],
        [0, 'empty'],
        [1, 'starter'],
        [5, 'starter'],
        [6, 'established'],
        [19, 'established'],
        [20, 'large'],
    ] as const)('returns %s for %s recipes', (recipeCount, expected) => {
        expect(getRecipeLibraryStage(recipeCount)).toBe(expected);
    });
});

describe('getHomeCapabilities', () => {
    it('identifies a completely empty home', () => {
        expect(
            getHomeCapabilities({
                recipeCount: 0,
                notesCount: 0,
                importsCount: 0,
                hasShoppingList: false,
                hasCollections: false,
                hasFavorites: false,
            })
        ).toMatchObject({
            stage: 'empty',
            hasRecipes: false,
            hasRecentActivity: false,
        });
    });

    it.each([
        ['notes', { notesCount: 1 }],
        ['imports', { importsCount: 1 }],
        ['shopping list', { hasShoppingList: true }],
    ])('shows recent activity when the user has %s without recipes', (_source, changes) => {
        const capabilities = getHomeCapabilities({
            recipeCount: 0,
            notesCount: 0,
            importsCount: 0,
            hasShoppingList: false,
            hasCollections: false,
            hasFavorites: false,
            ...changes,
        });

        expect(capabilities.stage).toBe('empty');
        expect(capabilities.hasRecentActivity).toBe(true);
    });

    it('preserves collection and favorite capabilities for populated libraries', () => {
        expect(
            getHomeCapabilities({
                recipeCount: 6,
                notesCount: 0,
                importsCount: 0,
                hasShoppingList: false,
                hasCollections: true,
                hasFavorites: true,
            })
        ).toMatchObject({
            stage: 'established',
            hasRecipes: true,
            hasCollections: true,
            hasFavorites: true,
        });
    });
});

describe('buildHomeActivity', () => {
    it('combines activity by recency and uses fallback titles', () => {
        const activity = buildHomeActivity({
            recipes: [
                {
                    id: 'recipe-1',
                    title: 'Older recipe',
                    createdAt: '2026-08-01T12:00:00.000Z',
                },
            ],
            notes: [
                {
                    id: 'note-1',
                    title: ' ',
                    createdAt: '2026-08-03T12:00:00.000Z',
                },
            ],
            imports: [
                {
                    id: 'import-1',
                    title: null,
                    createdAt: '2026-08-02T12:00:00.000Z',
                },
            ],
            noteFallbackTitle: 'Untitled note',
            importFallbackTitle: 'Imported recipe',
        });

        expect(activity).toEqual([
            expect.objectContaining({ id: 'note:note-1', title: 'Untitled note', type: 'note' }),
            expect.objectContaining({ id: 'import:import-1', title: 'Imported recipe', type: 'import' }),
            expect.objectContaining({ id: 'recipe:recipe-1', title: 'Older recipe', type: 'recipe' }),
        ]);
    });

    it('omits invalid activity and honors its display limit', () => {
        const activity = buildHomeActivity({
            recipes: [
                { id: 'invalid', title: 'Invalid date', createdAt: 'not-a-date' },
                { id: 'first', title: 'First', createdAt: '2026-08-01T12:00:00.000Z' },
                { id: 'second', title: 'Second', createdAt: '2026-08-02T12:00:00.000Z' },
            ],
            notes: [],
            imports: [],
            noteFallbackTitle: 'Untitled note',
            importFallbackTitle: 'Imported recipe',
            limit: 1,
        });

        expect(activity).toEqual([
            expect.objectContaining({ id: 'recipe:second', title: 'Second' }),
        ]);
    });
});
