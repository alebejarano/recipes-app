import { createLocalRecipe } from '../localRecipesStorage'
import { getFirstAsync, runSqlAsync } from '@/lib/sqlite'
import { FREE_PLAN_MAX_RECIPES } from '@/features/subscription/constants/limits'

jest.mock('@/lib/sqlite', () => ({
    getAllAsync: jest.fn().mockResolvedValue([]),
    getFirstAsync: jest.fn(),
    runSqlAsync: jest.fn(),
    runSqlBatchAsync: jest.fn(),
}))
jest.mock('@/lib/localSqliteMigration', () => ({
    ensureLocalSqliteMigrationReady: jest.fn().mockResolvedValue(undefined),
}))
jest.mock('@/lib/fileSystem', () => ({
    File: class { info = jest.fn().mockResolvedValue({ exists: false }) },
}))
jest.mock('@/features/recipes/storage/importsStorage', () => ({
    importLocalImage: jest.fn(),
    isManagedLocalImportImageUri: jest.fn(),
    removeImportByUri: jest.fn(),
}))
jest.mock('@/features/recipes/storage/recipePdfStorage', () => ({
    deleteRecipePdfAttachmentsForRecipe: jest.fn(),
}))

const mockGetFirst = getFirstAsync as jest.Mock
const mockRunSql = runSqlAsync as jest.Mock

const recipe = {
    title: 'Boundary recipe',
    ingredients: [],
    folders: [],
    steps: [],
}

describe('createLocalRecipe free-plan limit', () => {
    beforeEach(() => {
        mockGetFirst.mockReset()
        mockRunSql.mockReset().mockResolvedValue(undefined)
    })

    it('allows the 100th Free recipe', async () => {
        mockGetFirst.mockResolvedValue({ count: FREE_PLAN_MAX_RECIPES - 1 })

        await expect(createLocalRecipe(recipe)).resolves.toMatchObject({ title: recipe.title })
        expect(mockRunSql).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO local_recipes'), expect.any(Array))
    })

    it('rejects the 101st Free recipe before it writes anything', async () => {
        mockGetFirst.mockResolvedValue({ count: FREE_PLAN_MAX_RECIPES })

        await expect(createLocalRecipe(recipe)).rejects.toThrow('Local plan limit reached')
        expect(mockRunSql).not.toHaveBeenCalled()
    })

    it('does not apply the Free recipe cap to Premium', async () => {
        mockGetFirst.mockResolvedValue({ count: FREE_PLAN_MAX_RECIPES })

        await expect(createLocalRecipe(recipe, { plan: 'premium' })).resolves.toMatchObject({ title: recipe.title })
        expect(mockGetFirst).not.toHaveBeenCalled()
    })
})
