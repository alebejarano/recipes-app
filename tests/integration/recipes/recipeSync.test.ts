import AsyncStorage from '@react-native-async-storage/async-storage';
import { waitFor } from '@testing-library/react-native';
import { supabase } from '@/lib/supabase';
import {
    createRecipe,
    deleteRecipeById,
    listRecipes,
    updateRecipe,
} from '@/features/recipes/api/recipesRepo';
import {
    listDirtyLocalRecipeRowsForSync,
    listLocalRecipeRowsForImageRepair,
    markLocalRecipeSynced,
    mergeCloudRecipesIntoLocal,
    purgeLocalRecipeRow,
} from '@/features/recipes/storage/localRecipesStorage';
import { triggerRecipeSync } from '@/features/recipes/sync/recipeSync';

jest.mock('@react-native-async-storage/async-storage', () => ({
    __esModule: true,
    default: { getItem: jest.fn() },
}));

jest.mock('@/lib/supabase', () => ({
    supabase: { auth: { getSession: jest.fn() } },
}));

jest.mock('@/lib/productionLogger', () => ({
    getErrorCategory: jest.fn(() => 'network'),
    logOperationalEvent: jest.fn(),
}));

jest.mock('@/features/recipes/api/recipesRepo', () => ({
    createRecipe: jest.fn(),
    deleteRecipeById: jest.fn(),
    ensureCloudRecipeImageUrl: jest.fn(async (uri: string | null) => uri),
    listRecipes: jest.fn(),
    updateRecipe: jest.fn(),
}));

jest.mock('@/features/recipes/api/importsRepo', () => ({
    uploadPremiumImport: jest.fn(),
}));

jest.mock('@/features/recipes/storage/localRecipesStorage', () => ({
    listDirtyLocalRecipeRowsForSync: jest.fn(),
    listLocalRecipeRowsForImageRepair: jest.fn(),
    markLocalRecipeSynced: jest.fn(),
    mergeCloudRecipesIntoLocal: jest.fn(),
    purgeLocalRecipeRow: jest.fn(),
}));

jest.mock('@/features/recipes/storage/recipeDocumentStorage', () => ({
    listDirtyLocalRecipeDocumentRowsForSync: jest.fn().mockResolvedValue([]),
    markLocalRecipeDocumentSynced: jest.fn(),
}));

const mockStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockAuthSession = supabase.auth.getSession as jest.Mock;
const mockCreate = createRecipe as jest.Mock;
const mockUpdate = updateRecipe as jest.Mock;
const mockDelete = deleteRecipeById as jest.Mock;
const mockListCloud = listRecipes as jest.Mock;
const mockDirtyRows = listDirtyLocalRecipeRowsForSync as jest.Mock;
const mockImageRepairRows = listLocalRecipeRowsForImageRepair as jest.Mock;
const mockMarkSynced = markLocalRecipeSynced as jest.Mock;
const mockPurge = purgeLocalRecipeRow as jest.Mock;
const mockMerge = mergeCloudRecipesIntoLocal as jest.Mock;

const baseRow = {
    id: 'local-1',
    ownerUserId: 'user-1',
    cloudId: null as string | null,
    title: 'Pasta',
    subtitle: null,
    description: null,
    emoji: null,
    imageUrl: null,
    stepsText: 'Boil water\nAdd pasta',
    ingredientsJson: JSON.stringify(['Pasta']),
    foldersJson: JSON.stringify(['Dinner']),
    mealTimesJson: JSON.stringify(['dinner']),
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    servings: 2,
    deletedAt: null as string | null,
};

describe('recipe sync', () => {
    beforeEach(() => {
        mockAuthSession.mockResolvedValue({ data: { session: { user: { id: 'user-1' } } }, error: null });
        mockStorage.getItem.mockResolvedValue('premium');
        mockDirtyRows.mockResolvedValue([]);
        mockImageRepairRows.mockResolvedValue([]);
        mockListCloud.mockResolvedValue([]);
        mockMerge.mockResolvedValue(undefined);
        mockCreate.mockResolvedValue({ id: 'cloud-1' });
        mockUpdate.mockResolvedValue(undefined);
        mockDelete.mockResolvedValue(undefined);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('creates a dirty local recipe in the cloud and marks it synced', async () => {
        mockDirtyRows.mockResolvedValue([baseRow]);

        await triggerRecipeSync();

        expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
            title: 'Pasta',
            ingredients: ['Pasta'],
            steps: ['Boil water', 'Add pasta'],
            folders: ['Dinner'],
            mealTimes: ['dinner'],
        }));
        expect(mockMarkSynced).toHaveBeenCalledWith({
            localId: 'local-1',
            ownerUserId: 'user-1',
            cloudId: 'cloud-1',
        });
    });

    it('updates a cloud-backed local recipe instead of creating a duplicate', async () => {
        mockDirtyRows.mockResolvedValue([{ ...baseRow, cloudId: 'cloud-1' }]);

        await triggerRecipeSync();

        expect(mockUpdate).toHaveBeenCalledWith('cloud-1', expect.objectContaining({ title: 'Pasta' }));
        expect(mockCreate).not.toHaveBeenCalled();
        expect(mockMarkSynced).toHaveBeenCalledWith({
            localId: 'local-1',
            ownerUserId: 'user-1',
            cloudId: 'cloud-1',
        });
    });

    it('deletes a cloud-backed recipe and purges its local tombstone', async () => {
        mockDirtyRows.mockResolvedValue([{ ...baseRow, cloudId: 'cloud-1', deletedAt: '2026-08-05T12:00:00.000Z' }]);

        await triggerRecipeSync();

        expect(mockDelete).toHaveBeenCalledWith('cloud-1');
        expect(mockPurge).toHaveBeenCalledWith('local-1');
        expect(mockCreate).not.toHaveBeenCalled();
    });

    it('keeps a dirty row pending when the cloud is unreachable', async () => {
        mockDirtyRows.mockResolvedValue([baseRow]);
        mockCreate.mockRejectedValue(new Error('Network request failed'));

        await triggerRecipeSync();

        expect(mockCreate).toHaveBeenCalledTimes(1);
        expect(mockMarkSynced).not.toHaveBeenCalled();
        expect(mockPurge).not.toHaveBeenCalled();
    });

    it('deduplicates concurrent sync triggers', async () => {
        mockDirtyRows.mockResolvedValue([baseRow]);
        let resolveCreate: ((value: { id: string }) => void) | undefined;
        mockCreate.mockImplementation(() => new Promise((resolve) => { resolveCreate = resolve; }));

        const first = triggerRecipeSync();
        const second = triggerRecipeSync();
        expect(first).toBe(second);

        await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1));
        resolveCreate?.({ id: 'cloud-1' });
        await first;

        expect(mockCreate).toHaveBeenCalledTimes(1);
    });
});
