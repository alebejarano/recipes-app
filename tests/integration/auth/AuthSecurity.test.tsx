import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
            getUser: jest.fn(),
            verifyOtp: jest.fn(),
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
let queryClient: QueryClient;

const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
);

async function renderSecurityAuth() {
    const rendered = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(rendered.result.current.isLoading).toBe(false));
    return rendered;
}

describe('AuthProvider security flows', () => {
    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
        });
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
        mockAuth.getUser.mockResolvedValue({ data: { user: null }, error: null });
        mockAuth.verifyOtp.mockResolvedValue({ data: { session: { access_token: 'recovery-access-token' } }, error: null });
        mockInvoke.mockResolvedValue({ data: { success: true }, error: null });
        mockGetInitialURL.mockResolvedValue(null);
        mockAddEventListener.mockReturnValue({ remove: jest.fn() });
        jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    });

    afterEach(() => {
        queryClient.clear();
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });

    it('sends a password reset request for the recovery code flow', async () => {
        const { result, unmount } = await renderSecurityAuth();

        await act(async () => {
            await result.current.sendPasswordResetEmail('  COOK@EXAMPLE.COM ');
        });

        expect(mockAuth.resetPasswordForEmail).toHaveBeenCalledWith('cook@example.com');
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

    it('verifies a password reset code and stores its recovery session', async () => {
        const { result, unmount } = await renderSecurityAuth();

        await act(async () => {
            await result.current.verifyPasswordResetCode(' COOK@EXAMPLE.COM ', '123456');
        });

        expect(mockAuth.verifyOtp).toHaveBeenCalledWith({
            email: 'cook@example.com',
            token: '123456',
            type: 'recovery',
        });
        expect(result.current.session).toEqual({ access_token: 'recovery-access-token' });
        unmount();
    });

    it('verifies a signup code and stores its authenticated session', async () => {
        mockAuth.verifyOtp.mockResolvedValue({ data: { session: { access_token: 'signup-access-token' } }, error: null });
        const { result, unmount } = await renderSecurityAuth();

        await act(async () => {
            await result.current.verifySignupCode(' COOK@EXAMPLE.COM ', '123456');
        });

        expect(mockAuth.verifyOtp).toHaveBeenCalledWith({
            email: 'cook@example.com',
            token: '123456',
            type: 'signup',
        });
        expect(result.current.session).toEqual({ access_token: 'signup-access-token' });
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
        expect(mockAuth.updateUser).toHaveBeenCalledWith({ email: 'new@example.com' });
        unmount();
    });

    it('verifies an email-change code and refreshes the pending email state', async () => {
        mockAuth.getSession.mockResolvedValue({
            data: {
                session: {
                    user: { email: 'old@example.com', new_email: 'new@example.com' },
                },
            },
            error: null,
        });
        mockAuth.getUser.mockResolvedValue({
            data: { user: { email: 'new@example.com', new_email: null } },
            error: null,
        });
        mockAuth.verifyOtp.mockResolvedValue({ data: { session: { access_token: 'email-change-token' } }, error: null });
        const { result, unmount } = await renderSecurityAuth();

        let verification: { completed: boolean } | undefined;
        await act(async () => {
            verification = await result.current.verifyEmailChangeCode('new@example.com', '123456');
        });

        expect(mockAuth.verifyOtp).toHaveBeenCalledWith({
            email: 'new@example.com',
            token: '123456',
            type: 'email_change',
        });
        expect(verification).toEqual({ completed: true });
        expect(result.current.user?.email).toBe('new@example.com');
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

    it('recognizes a completed email change even when its redirect reports an error', async () => {
        mockAuth.getSession.mockResolvedValue({
            data: {
                session: {
                    user: { email: 'old@example.com', new_email: 'new@example.com' },
                },
            },
            error: null,
        });
        mockAuth.getUser.mockResolvedValue({
            data: { user: { email: 'new@example.com', new_email: null } },
            error: null,
        });
        mockGetInitialURL.mockResolvedValue('recipes://login?error=access_denied&error_code=expired');

        const { unmount } = await renderSecurityAuth();

        await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith(
            'profile.editProfile.emailUpdatedTitle',
            'profile.editProfile.emailUpdatedMessage'
        ));
        expect(Alert.alert).not.toHaveBeenCalledWith(
            'auth.errors.authLinkExpiredTitle',
            'auth.errors.confirmationLinkInvalid'
        );
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
