import { getUserFacingErrorMessage } from '../userFacingError';

describe('getUserFacingErrorMessage', () => {
    it.each([
        ['a network timeout', 'We could not connect. Check your internet connection and try again.'],
        ['JWT has expired', 'Your session expired. Please sign in again.'],
        ['duplicate key value violates unique constraint', 'This already exists.'],
        ['row-level security policy blocked this request', 'You do not have permission to do that.'],
    ])('maps %s to an actionable message', (message, expected) => {
        expect(getUserFacingErrorMessage(new Error(message))).toBe(expected);
    });

    it('uses the fallback for an unknown error with a long message', () => {
        expect(getUserFacingErrorMessage(new Error('x'.repeat(141)), 'Try again later.')).toBe(
            'Try again later.'
        );
    });
});
