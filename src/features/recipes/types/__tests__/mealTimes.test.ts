import { inferMealTimes, normalizeMealTimes, resolveMealTimes } from '../mealTimes';

describe('recipe meal times', () => {
    it('keeps only supported meal times and removes duplicates', () => {
        expect(normalizeMealTimes([' dinner ', 'dinner', 'brunch', 'BREAKFAST'])).toEqual([
            'dinner',
            'breakfast',
        ]);
    });

    it('infers meal times from recipe content when none were selected', () => {
        expect(resolveMealTimes([], { title: 'Quick pasta dinner' })).toContain('dinner');
    });

    it('uses the explicitly selected meal times instead of inferred values', () => {
        expect(resolveMealTimes(['breakfast'], { title: 'Pasta dinner' })).toEqual(['breakfast']);
    });

    it('does not infer a meal time from empty recipe content', () => {
        expect(inferMealTimes({ title: ' ', subtitle: null, folders: [] })).toEqual([]);
    });
});
