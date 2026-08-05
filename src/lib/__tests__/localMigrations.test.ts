import AsyncStorage from '@react-native-async-storage/async-storage';
import { runLocalMigrations } from '../localMigrations';

jest.mock('@react-native-async-storage/async-storage', () => ({
    __esModule: true,
    default: { getItem: jest.fn(), setItem: jest.fn() },
}));

const mockStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('runLocalMigrations', () => {
    beforeEach(() => jest.clearAllMocks());

    it('normalizes legacy recipe, note, and folder records', async () => {
        mockStorage.getItem.mockImplementation(async (key) => ({
            'recipes:local': JSON.stringify([{ id: 'r1', title: 'Pasta', steps: ['Boil', 'Serve'] }]),
            'notes:local': JSON.stringify([{ id: 'n1', content: 'Remember' }]),
            'folders:local': JSON.stringify([{ id: 'f1', name: 'Dinner' }]),
        }[key] ?? null));

        await runLocalMigrations();

        expect(mockStorage.setItem).toHaveBeenCalledTimes(3);
        const recipes = JSON.parse(mockStorage.setItem.mock.calls.find(([key]) => key === 'recipes:local')![1]);
        expect(recipes[0]).toMatchObject({ id: 'r1', title: 'Pasta', steps_text: 'Boil\nServe', dirty: 1, version: 1 });
        const notes = JSON.parse(mockStorage.setItem.mock.calls.find(([key]) => key === 'notes:local')![1]);
        expect(notes[0]).toMatchObject({ id: 'n1', content: 'Remember', pinned_at: null, dirty: 1 });
    });

    it('leaves malformed legacy values untouched', async () => {
        mockStorage.getItem.mockResolvedValue('{not-json');

        await runLocalMigrations();

        expect(mockStorage.setItem).not.toHaveBeenCalled();
    });
});
