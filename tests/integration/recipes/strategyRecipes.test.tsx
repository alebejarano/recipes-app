import { renderHook } from '@testing-library/react-native';

import {
    useStrategyCreateRecipe,
    useStrategyDeleteRecipe,
    useStrategyUpdateRecipe,
} from '@/features/recipes/hooks/useStrategyRecipes';
import { useCreateRecipe } from '@/features/recipes/hooks/useCreateRecipe';
import { useDeleteRecipe } from '@/features/recipes/hooks/useDeleteRecipe';
import { useUpdateRecipe } from '@/features/recipes/hooks/useUpdateRecipe';

jest.mock('@/features/recipes/hooks/useCreateRecipe', () => ({ useCreateRecipe: jest.fn() }));
jest.mock('@/features/recipes/hooks/useDeleteRecipe', () => ({ useDeleteRecipe: jest.fn() }));
jest.mock('@/features/recipes/hooks/useUpdateRecipe', () => ({ useUpdateRecipe: jest.fn() }));
jest.mock('@/features/recipes/hooks/useRecipe', () => ({ useRecipe: jest.fn() }));
jest.mock('@/features/recipes/hooks/useRecipesList', () => ({ useRecipesList: jest.fn() }));
jest.mock('@/features/recipes/hooks/useLocalRecipes', () => ({
    useCreateLocalRecipe: jest.fn(),
    useDeleteLocalRecipe: jest.fn(),
    useLocalRecipe: jest.fn(),
    useLocalRecipesList: jest.fn(),
    useUpdateLocalRecipe: jest.fn(),
}));
jest.mock('@/features/storage/context/StorageStrategyContext', () => ({
    useStorageStrategy: () => ({ cloudSyncEnabled: true }),
}));
jest.mock('@/features/storage/hooks/useStorageDataMode', () => ({
    useStorageDataMode: () => ({ isStorageModeReady: true, shouldUseLocalData: false }),
}));
jest.mock('@/lib/productionLogger', () => ({
    getErrorCategory: jest.fn(() => 'network'),
    logOperationalEvent: jest.fn(),
}));

const mockCloudCreate = jest.fn();
const mockLocalCreate = jest.fn();
const mockCloudUpdate = jest.fn();
const mockLocalUpdate = jest.fn();
const mockCloudDelete = jest.fn();
const mockLocalDelete = jest.fn();

const cloudCreateHook = useCreateRecipe as jest.Mock;
const localCreateHook = (jest.requireMock('@/features/recipes/hooks/useLocalRecipes') as { useCreateLocalRecipe: jest.Mock }).useCreateLocalRecipe;
const cloudUpdateHook = useUpdateRecipe as jest.Mock;
const localUpdateHook = (jest.requireMock('@/features/recipes/hooks/useLocalRecipes') as { useUpdateLocalRecipe: jest.Mock }).useUpdateLocalRecipe;
const cloudDeleteHook = useDeleteRecipe as jest.Mock;
const localDeleteHook = (jest.requireMock('@/features/recipes/hooks/useLocalRecipes') as { useDeleteLocalRecipe: jest.Mock }).useDeleteLocalRecipe;

describe('cloud-sync recipe strategy', () => {
    beforeEach(() => {
        cloudCreateHook.mockReturnValue({ mutateAsync: mockCloudCreate });
        localCreateHook.mockReturnValue({ mutateAsync: mockLocalCreate });
        cloudUpdateHook.mockReturnValue({ mutateAsync: mockCloudUpdate });
        localUpdateHook.mockReturnValue({ mutateAsync: mockLocalUpdate });
        cloudDeleteHook.mockReturnValue({ mutateAsync: mockCloudDelete });
        localDeleteHook.mockReturnValue({ mutateAsync: mockLocalDelete });
    });

    afterEach(() => jest.clearAllMocks());

    it('falls back to local create when the cloud is unreachable', async () => {
        mockCloudCreate.mockRejectedValue(new Error('Network request failed'));
        mockLocalCreate.mockResolvedValue({ id: 'local-1' });
        const { result } = await renderHook(() => useStrategyCreateRecipe());

        await expect(result.current.mutateAsync({ title: 'Pasta' } as never)).resolves.toEqual({ id: 'local-1' });
        expect(mockLocalCreate).toHaveBeenCalledTimes(1);
    });

    it('falls back to local update when the cloud times out', async () => {
        mockCloudUpdate.mockRejectedValue(new Error('Request timed out'));
        mockLocalUpdate.mockResolvedValue({ id: 'local-1' });
        const { result } = await renderHook(() => useStrategyUpdateRecipe('local-1'));

        await expect(result.current.mutateAsync({ title: 'Updated pasta' } as never)).resolves.toEqual({ id: 'local-1' });
        expect(mockLocalUpdate).toHaveBeenCalledTimes(1);
    });

    it('falls back to local delete on a network failure', async () => {
        mockCloudDelete.mockRejectedValue(new Error('Failed to fetch'));
        mockLocalDelete.mockResolvedValue(undefined);
        const { result } = await renderHook(() => useStrategyDeleteRecipe());

        await expect(result.current.mutateAsync('cloud-1')).resolves.toBeUndefined();
        expect(mockLocalDelete).toHaveBeenCalledWith('cloud-1');
    });

    it('does not hide non-network cloud errors behind local fallback', async () => {
        const error = new Error('Permission denied');
        mockCloudCreate.mockRejectedValue(error);
        const { result } = await renderHook(() => useStrategyCreateRecipe());

        await expect(result.current.mutateAsync({ title: 'Pasta' } as never)).rejects.toBe(error);
        expect(mockLocalCreate).not.toHaveBeenCalled();
    });
});
