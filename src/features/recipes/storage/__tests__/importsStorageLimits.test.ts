import { assertCanAddImport } from '../importsStorage';
import { getFirstAsync, runSqlBatchAsync } from '@/lib/sqlite';
import {
    FREE_PLAN_MAX_IMPORT_FILE_BYTES,
    FREE_PLAN_MAX_IMPORT_TOTAL_BYTES,
    PREMIUM_PLAN_MAX_STORAGE_BYTES,
} from '@/features/subscription/constants/limits';

jest.mock('@/lib/fileSystem', () => ({
    Directory: class { uri = 'file:///documents/'; },
    File: class { info = jest.fn().mockResolvedValue({ exists: false }); },
    Paths: { document: 'file:///documents' },
}));
jest.mock('@/lib/sqlite', () => ({
    getFirstAsync: jest.fn(),
    getAllAsync: jest.fn().mockResolvedValue([]),
    runSqlAsync: jest.fn(),
    runSqlBatchAsync: jest.fn(),
}));
jest.mock('@/lib/localSqliteMigration', () => ({ ensureLocalSqliteMigrationReady: jest.fn() }));

const mockGetFirst = getFirstAsync as jest.Mock;
const mockRunSqlBatch = runSqlBatchAsync as jest.Mock;

describe('assertCanAddImport', () => {
    beforeEach(() => {
        mockRunSqlBatch.mockResolvedValue(undefined);
        mockGetFirst.mockImplementation(async (sql: string) => {
            if (sql.includes('COUNT(*)')) return { totalCount: 1, totalBytes: 0 };
            return { bytes: 0 };
        });
    });

    afterEach(() => jest.clearAllMocks());

    it('rejects invalid and oversized files before storage checks', async () => {
        await expect(assertCanAddImport({ plan: 'free', incomingBytes: 0 })).rejects.toThrow('Invalid file size.');
        await expect(assertCanAddImport({ plan: 'free', incomingBytes: FREE_PLAN_MAX_IMPORT_FILE_BYTES + 1 })).rejects.toThrow('larger than 10MB');
        expect(mockGetFirst).not.toHaveBeenCalled();
    });

    it('enforces the free total storage limit', async () => {
        mockGetFirst.mockResolvedValue({ totalCount: 1, totalBytes: FREE_PLAN_MAX_IMPORT_TOTAL_BYTES });

        await expect(assertCanAddImport({ plan: 'free', incomingBytes: 1 })).rejects.toThrow('Import limit reached');
    });

    it('allows replacing an existing file at the free limit when size is unchanged', async () => {
        mockGetFirst.mockImplementation(async (sql: string) => {
            if (sql.includes('COUNT(*)')) return { totalCount: 1, totalBytes: FREE_PLAN_MAX_IMPORT_TOTAL_BYTES };
            return { bytes: 1 };
        });

        await expect(assertCanAddImport({
            plan: 'free',
            incomingBytes: 1,
            replacingFileUri: 'file:///documents/old.jpg',
        })).resolves.toBeUndefined();
    });

    it('uses the premium storage limit for premium imports', async () => {
        mockGetFirst.mockResolvedValue({ totalCount: 1, totalBytes: PREMIUM_PLAN_MAX_STORAGE_BYTES });

        await expect(assertCanAddImport({ plan: 'premium', incomingBytes: 1 })).rejects.toThrow('Storage limit reached');
    });
});
