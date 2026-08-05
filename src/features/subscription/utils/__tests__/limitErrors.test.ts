import { getPlanLimitTypeFromError } from '../limitErrors';

describe('getPlanLimitTypeFromError', () => {
    it.each([
        ['Local plan limit reached. You can save up to 100 recipes.', 'recipes'],
        ['The recipe limit has been reached.', 'recipes'],
        ['Import limit reached. Free plan allows 50 MB total.', 'storage'],
        ['Storage limit reached. Premium includes up to 5 GB total.', 'storage'],
    ] as const)('classifies %s as a %s limit', (message, expected) => {
        expect(getPlanLimitTypeFromError(new Error(message))).toBe(expected);
    });

    it('does not turn unrelated errors into upgrade prompts', () => {
        expect(getPlanLimitTypeFromError(new Error('Network request failed'))).toBeNull();
        expect(getPlanLimitTypeFromError(null)).toBeNull();
    });
});
