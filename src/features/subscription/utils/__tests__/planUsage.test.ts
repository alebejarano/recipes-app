import {
    buildFreePlanUsageSnapshot,
    formatMegabytes,
    getUsageBand,
} from '../planUsage';

describe('getUsageBand', () => {
    it.each([
        [69, 'under70'],
        [70, 'between70and84'],
        [84.99, 'between70and84'],
        [85, 'between85and94'],
        [94.99, 'between85and94'],
        [95, 'between95and99'],
        [99.99, 'between95and99'],
        [100, 'atLimit'],
    ] as const)('returns %s for %s%% usage', (percent, expected) => {
        expect(getUsageBand(percent)).toBe(expected);
    });
});

describe('formatMegabytes', () => {
    it('rounds bytes to megabytes and clamps negative values', () => {
        expect(formatMegabytes(-1)).toBe(0);
        expect(formatMegabytes(1.5 * 1024 * 1024)).toBe(2);
    });
});

describe('buildFreePlanUsageSnapshot', () => {
    it('reports usage at the recipe and storage limits', () => {
        const snapshot = buildFreePlanUsageSnapshot(100, 50 * 1024 * 1024);

        expect(snapshot).toMatchObject({
            recipesSaved: 100,
            recipesUsagePercent: 100,
            recipesUsageBand: 'atLimit',
            storageBytesUsed: 50 * 1024 * 1024,
            storageUsagePercent: 100,
            storageUsageBand: 'atLimit',
            storageMbUsed: 50,
            storageMbLimit: 50,
            upgradeUsageBand: 'atLimit',
        });
    });

    it('clamps negative inputs to zero', () => {
        const snapshot = buildFreePlanUsageSnapshot(-1, -1);

        expect(snapshot).toMatchObject({
            recipesSaved: 0,
            recipesUsagePercent: 0,
            recipesUsageBand: 'under70',
            storageBytesUsed: 0,
            storageUsagePercent: 0,
            storageUsageBand: 'under70',
            upgradeUsageBand: 'under70',
        });
    });

    it('caps usage percentages when input exceeds a free-plan limit', () => {
        const snapshot = buildFreePlanUsageSnapshot(101, 51 * 1024 * 1024);

        expect(snapshot.recipesUsagePercent).toBe(100);
        expect(snapshot.storageUsagePercent).toBe(100);
        expect(snapshot.upgradeUsageBand).toBe('atLimit');
    });
});
