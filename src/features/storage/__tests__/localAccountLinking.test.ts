import { getFirstAsync, runSqlAsync } from '@/lib/sqlite';
import { tagLocalDataAsMigratable } from '../localAccountLinking';

jest.mock('@/lib/localSqliteMigration', () => ({ ensureLocalSqliteMigrationReady: jest.fn() }));
jest.mock('@/lib/sqlite', () => ({ getFirstAsync: jest.fn(), runSqlAsync: jest.fn() }));

const mockGetFirst = getFirstAsync as jest.Mock;
const mockRunSql = runSqlAsync as jest.Mock;

describe('tagLocalDataAsMigratable', () => {
    beforeEach(() => {
        mockGetFirst
            .mockResolvedValueOnce({ count: 2 })
            .mockResolvedValueOnce({ count: 1 })
            .mockResolvedValueOnce({ count: 3 });
        mockRunSql.mockResolvedValue({ changes: 1, lastInsertRowId: 0 });
    });

    afterEach(() => jest.clearAllMocks());

    it('tags only unowned local recipes, notes, and folders', async () => {
        await expect(tagLocalDataAsMigratable(' user-1 ')).resolves.toEqual({
            recipes: 2,
            notes: 1,
            folders: 3,
        });

        expect(mockRunSql).toHaveBeenCalledTimes(3);
        for (const [sql, params] of mockRunSql.mock.calls) {
            expect(sql).toContain('WHERE owner_user_id IS NULL OR owner_user_id =');
            expect(params).toEqual(['user-1']);
        }
    });

    it('does nothing for a blank account id', async () => {
        await expect(tagLocalDataAsMigratable('   ')).resolves.toEqual({ recipes: 0, notes: 0, folders: 0 });
        expect(mockGetFirst).not.toHaveBeenCalled();
        expect(mockRunSql).not.toHaveBeenCalled();
    });
});
