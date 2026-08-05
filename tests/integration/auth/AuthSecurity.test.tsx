import { act, renderHook, waitFor } from '@testing-library/react-native';
import * as Linking from 'expo-linking';
import { Alert } from 'react-native';
import type { PropsWithChildren } from 'react';

import { AuthProvider, useAuth } from '@/features/auth/context/AuthContext';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
    supabase: {
        auth: {
            getSession: jest.fn(),
            onAuthStateChange: jest.fn(),
            resetPasswordForEmail: jest.fn(),
            updateUser: jest.fn(),
            refreshSession: jest.fn(),
            signOut: jest.fn(),
            exchangeCodeForSession: jest.fn(),
            setSession: jest.fn(),
        },
        functions: { invoke: jest.fn() },
    },
}));

jest.mock('expo-linking', () => ({
    createURL: jest.fn((path: string) => `recipes://${path.replace(/^\//, '')}`),
    parse: jest.fn((url: string) => {
        const parsed = new URL(url);
        return {
            path: parsed.pathname.replace(/^\//, '') || null,
            queryParams: Object.fromEntries(parsed.searchParams.entries()),
        };
    }),
    getInitialURL: jest.fn(),
    addEventListener: jest.fn(),
}));

jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }));
jest.mock('@/features/storage/localAccountLinking', () => ({
    tagLocalDataAsMigratable: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/localization', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

const mockAuth = supabase.auth as unknown as Record<string, jest.Mock>;
const mockInvoke = supabase.functions.invoke as jest.Mock;
const mockGetInitialURL = Linking.getInitialURL as jest.Mock;
const mockAddEventListener = Linking.addEventListener as jest.Mock;
const wrapper = ({ children }: PropsWithChildren) => <AuthProvider>{children}</AuthProvider>;

async function renderSecurityAuth() {
    const rendered = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(rendered.result.current.isLoading).toBe(false));
    return rendered;
}

describe('AuthProvider security flows', () => {
    beforeEach(() => {
        mockAuth.getSession.mockResolvedValue({ data: { session: null }, error: null });
        mockAuth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } });
        mockAuth.resetPasswordForEmail.mockResolvedValue({ error: null });
        mockAuth.updateUser.mockResolvedValue({ data: { user: null }, error: null });
        mockAuth.refreshSession.mockResolvedValue({
            data: { session: { access_token: 'access-token' } },
            error: null,
        });
        mockAuth.signOut.mockResolvedValue({ error: null });
        mockAuth.exchangeCodeForSession.mockResolvedValue({ error: null });
        mockAuth.setSession.mockResolvedValue({ error: null });
        mockInvoke.mockResolvedValue({ data: { success: true }, error: null });
        mockGetInitialURL.mockResolvedValue(null);
        mockAddEventListener.mockReturnValue({ remove: jest.fn() });
        jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });

    it('sends a password reset request with a recovery redirect', async () => {
        const { result, unmount } = await renderSecurityAuth();

        await act(async () => {
            await result.current.sendPasswordResetEmail('  COOK@EXAMPLE.COM ');
        });

        expect(mockAuth.resetPasswordForEmail).toHaveBeenCalledWith('cook@example.com', {
            redirectTo: 'recipes://update-password',
        });
        unmount();
    });

    it('rejects invalid password-reset emails before contacting Supabase', async () => {
        const { result, unmount } = await renderSecurityAuth();

        await expect(result.current.sendPasswordResetEmail('invalid-email')).rejects.toThrow(
            'Please enter a valid email address.'
        );
        expect(mockAuth.resetPasswordForEmail).not.toHaveBeenCalled();
        unmount();
    });

    it('requests email confirmation for a normalized replacement address', async () => {
        mockAuth.updateUser.mockResolvedValue({
            data: { user: { new_email: 'new@example.com' } },
            error: null,
        });
        const { result, unmount } = await renderSecurityAuth();

        let pendingEmail: { pendingEmail: string | null } | undefined;
        await act(async () => {
            pendingEmail = await result.current.updateEmailAddress(' NEW@EXAMPLE.COM ');
        });
        expect(pendingEmail).toEqual({ pendingEmail: 'new@example.com' });
        expect(mockAuth.updateUser).toHaveBeenCalledWith(
            { email: 'new@example.com' },
            { emailRedirectTo: 'recipes://login' }
        );
        unmount();
    });

    it('shows an alert for an expired auth deep link', async () => {
        mockGetInitialURL.mockResolvedValue('recipes://login?error=access_denied&error_code=expired');

        const { unmount } = await renderSecurityAuth();

        await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith(
            'auth.errors.authLinkExpiredTitle',
            'auth.errors.confirmationLinkInvalid'
        ));
        unmount();
    });

    it('shows an alert when a recovery code cannot be exchanged', async () => {
        mockGetInitialURL.mockResolvedValue('recipes:///update-password?code=expired-code');
        mockAuth.exchangeCodeForSession.mockResolvedValue({ error: new Error('Code expired') });

        const { unmount } = await renderSecurityAuth();

        await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith(
            'auth.errors.authLinkExpiredTitle',
            'auth.updatePassword.invalidLink'
        ));
        unmount();
    });

    it('returns a useful error and does not sign out when delete-account fails', async () => {
        const context = {
            status: 500,
            text: jest.fn().mockResolvedValue(JSON.stringify({ error: 'Database unavailable' })),
        };
        mockInvoke.mockResolvedValue({ error: Object.assign(new Error('Function failed'), { context }) });
        const { result, unmount } = await renderSecurityAuth();

        await expect(result.current.deleteAccount()).rejects.toThrow(
            'Delete account failed (500): Database unavailable'
        );
        expect(mockAuth.signOut).not.toHaveBeenCalled();
        unmount();
    });

    it('clears the local session after successful account deletion', async () => {
        const { result, unmount } = await renderSecurityAuth();

        await act(async () => {
            await result.current.deleteAccount();
        });

        expect(mockInvoke).toHaveBeenCalledWith('delete-account', {
            headers: { Authorization: 'Bearer access-token' },
        });
        expect(mockAuth.signOut).toHaveBeenCalledWith({ scope: 'local' });
        expect(result.current.session).toBeNull();
        unmount();
    });
});
