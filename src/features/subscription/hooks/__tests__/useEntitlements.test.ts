import { renderHook } from '@testing-library/react-native';
import { useEntitlements } from '../useEntitlements';

let mockStrategy = { cloudSyncEnabled: false, isPremium: false };

jest.mock('@/features/storage/context/StorageStrategyContext', () => ({
    useStorageStrategy: () => mockStrategy,
}));

describe('useEntitlements', () => {
    it('reports free entitlements without cloud sync', async () => {
        mockStrategy = { cloudSyncEnabled: false, isPremium: false };
        const { result } = await renderHook(() => useEntitlements());

        expect(result.current).toEqual({ canUseCloudSync: false, isPremium: false });
    });

    it('reports premium cloud-sync entitlements', async () => {
        mockStrategy = { cloudSyncEnabled: true, isPremium: true };
        const { result } = await renderHook(() => useEntitlements());

        expect(result.current).toEqual({ canUseCloudSync: true, isPremium: true });
    });
});
