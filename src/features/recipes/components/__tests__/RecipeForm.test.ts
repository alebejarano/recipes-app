import {
    buildRecipeFormSubmitValues,
    createEmptyRecipeFormValues,
} from '../RecipeForm';

jest.mock('expo-image', () => ({ Image: () => null }));
jest.mock('@/localization', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('@/features/recipes/api/recipesRepo', () => ({ uploadRecipeImage: jest.fn() }));
jest.mock('@/features/recipes/storage/importsStorage', () => ({
    getActiveImportBytesByUri: jest.fn().mockResolvedValue(0),
    getImportsUsageSummary: jest.fn().mockResolvedValue({ totalCount: 0, totalBytes: 0 }),
    isManagedLocalImportImageUri: jest.fn().mockReturnValue(false),
}));

describe('buildRecipeFormSubmitValues', () => {
    it('requires a non-empty title', () => {
        expect(
            buildRecipeFormSubmitValues({
                ...createEmptyRecipeFormValues(),
                title: '   ',
            })
        ).toBeNull();
    });

    it('normalizes a valid recipe before saving', () => {
        const payload = buildRecipeFormSubmitValues({
            ...createEmptyRecipeFormValues(),
            title: '  Pasta primavera  ',
            subtitle: '  Fresh and quick  ',
            description: '  A weeknight favorite.  ',
            imageUrl: '  https://example.com/pasta.jpg  ',
            prepTimeMinutes: ' 15.8 ',
            cookTimeMinutes: '-5',
            servings: ' 4 ',
            ingredientsText: ' Pasta \n\n  Tomatoes  \n Basil ',
            steps: [' Boil water ', ' ', ' Toss everything together '],
            folders: [' Dinner ', ' ', ' Quick meals '],
            mealTimes: ['dinner'],
        });

        expect(payload).toEqual({
            title: 'Pasta primavera',
            subtitle: 'Fresh and quick',
            description: 'A weeknight favorite.',
            emoji: null,
            imageUrl: 'https://example.com/pasta.jpg',
            prepTimeMinutes: 15,
            cookTimeMinutes: null,
            servings: 4,
            ingredients: ['Pasta', 'Tomatoes', 'Basil'],
            steps: ['Boil water', 'Toss everything together'],
            folders: ['Dinner', 'Quick meals'],
            mealTimes: ['dinner'],
        });
    });

    it('uses an emoji cover in preference to an image and omits empty optional fields', () => {
        const payload = buildRecipeFormSubmitValues({
            ...createEmptyRecipeFormValues(),
            title: 'Toast',
            emoji: ' 🍞 ',
            imageUrl: 'https://example.com/toast.jpg',
        });

        expect(payload).toMatchObject({
            title: 'Toast',
            emoji: '🍞',
            imageUrl: null,
            subtitle: null,
            description: null,
            prepTimeMinutes: null,
            cookTimeMinutes: null,
            servings: null,
            ingredients: null,
            steps: null,
            folders: null,
            mealTimes: null,
        });
    });
});
