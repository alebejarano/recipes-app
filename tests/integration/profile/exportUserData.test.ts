import { exportUserData } from '@/features/profile/services/exportUserData';
import * as Sharing from 'expo-sharing';
import { Directory, File } from '@/lib/fileSystem';
import { listLocalFoldersRepo } from '@/features/folders/api/foldersLocalRepo';
import { listLocalNotes } from '@/features/notes/storage/localNotesStorage';
import { listLocalRecipes } from '@/features/recipes/storage/localRecipesStorage';
import { listRecipeDocuments } from '@/features/recipes/storage/recipeDocumentStorage';
import { getShoppingListItems } from '@/features/shopping-list/storage/shoppingListItemsStorage';
import { getShoppingListId } from '@/features/shopping-list/storage/shoppingListStorage';

jest.mock('expo-sharing', () => ({ isAvailableAsync: jest.fn(), shareAsync: jest.fn() }));
jest.mock('@/lib/fileSystem', () => ({
    Directory: jest.fn().mockImplementation(() => ({ uri: 'file:///cache/exported-data', exists: false, create: jest.fn() })),
    File: jest.fn().mockImplementation((directory: { uri: string }, name: string) => ({
        uri: `${directory.uri}/${name}`,
        create: jest.fn(),
        write: jest.fn(),
    })),
    Paths: { cache: 'file:///cache' },
}));
jest.mock('@/features/folders/api/foldersLocalRepo', () => ({ listLocalFoldersRepo: jest.fn() }));
jest.mock('@/features/notes/storage/localNotesStorage', () => ({ listLocalNotes: jest.fn() }));
jest.mock('@/features/recipes/storage/localRecipesStorage', () => ({ listLocalRecipes: jest.fn() }));
jest.mock('@/features/recipes/storage/recipeDocumentStorage', () => ({ listRecipeDocuments: jest.fn() }));
jest.mock('@/features/shopping-list/storage/shoppingListItemsStorage', () => ({ getShoppingListItems: jest.fn() }));
jest.mock('@/features/shopping-list/storage/shoppingListStorage', () => ({ getShoppingListId: jest.fn() }));

const mockSharing = Sharing as jest.Mocked<typeof Sharing>;
const mockFile = File as jest.Mock;

describe('exportUserData', () => {
    beforeEach(() => {
        mockSharing.isAvailableAsync.mockResolvedValue(true);
        mockSharing.shareAsync.mockResolvedValue();
        jest.mocked(listLocalRecipes).mockResolvedValue([{ id: 'recipe-1', title: 'Pasta' }] as never);
        jest.mocked(listLocalNotes).mockResolvedValue([{ id: 'note-1', title: 'Ideas' }] as never);
        jest.mocked(listLocalFoldersRepo).mockResolvedValue([{ id: 'folder-1', name: 'Dinner' }] as never);
        jest.mocked(listRecipeDocuments).mockResolvedValue([{
            id: 'doc-1', title: 'Recipe PDF', fileName: 'recipe.pdf', fileUri: 'file:///recipe.pdf', fileSize: 100, createdAt: '2026-08-01',
        }] as never);
        jest.mocked(getShoppingListId).mockResolvedValue('list-1');
        jest.mocked(getShoppingListItems).mockResolvedValue([{ id: 'item-1', name: 'Tomatoes', checked: false }] as never);
    });

    afterEach(() => jest.clearAllMocks());

    it('exports all user data collections and shares a sanitized JSON file', async () => {
        await exportUserData({
            userId: 'user-1',
            email: 'Cook+Test@example.com',
            displayName: 'Test Cook',
            storageStrategy: 'account-local-migratable',
        });

        const createdFile = mockFile.mock.results[0]?.value as { write: jest.Mock; uri: string };
        const payload = JSON.parse(createdFile.write.mock.calls[0][0]);

        expect(payload).toMatchObject({
            schemaVersion: 1,
            account: {
                userId: 'user-1',
                email: 'Cook+Test@example.com',
                storageStrategy: 'account-local-migratable',
            },
            recipes: [{ id: 'recipe-1', title: 'Pasta' }],
            notes: [{ id: 'note-1', title: 'Ideas' }],
            folders: [{ id: 'folder-1', name: 'Dinner' }],
            recipeDocuments: [{ id: 'doc-1', fileName: 'recipe.pdf', fileSize: 100 }],
            shoppingList: {
                id: 'list-1',
                items: [{ id: 'item-1', name: 'Tomatoes', checked: false }],
            },
        });
        expect(createdFile.uri).toContain('cook-test-example.com-');
        expect(mockSharing.shareAsync).toHaveBeenCalledWith(createdFile.uri, expect.objectContaining({ mimeType: 'application/json' }));
    });

    it('fails clearly when device sharing is unavailable', async () => {
        mockSharing.isAvailableAsync.mockResolvedValue(false);

        await expect(exportUserData({
            userId: null,
            email: null,
            displayName: 'Cook',
            storageStrategy: 'anonymous-local',
        })).rejects.toThrow('Sharing is not available on this device.');
        expect(mockSharing.shareAsync).not.toHaveBeenCalled();
    });
});
