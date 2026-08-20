import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import type { Session } from '@supabase/supabase-js';

import { AuthProvider, useAuth } from '@/features/auth/context/AuthContext';
import { tagLocalDataAsMigratable } from '@/features/storage/localAccountLinking';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
    supabase: {
        auth: {
            getSession: jest.fn(),
            signInWithPassword: jest.fn(),
            signOut: jest.fn(),
            signUp: jest.fn(),
            onAuthStateChange: jest.fn(),
        },
    },
}));

jest.mock('expo-linking', () => ({
    getInitialURL: jest.fn().mockResolvedValue(null),
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
}));

jest.mock('expo-router', () => ({
    router: { replace: jest.fn() },
}));

jest.mock('@/features/storage/localAccountLinking', () => ({
    tagLocalDataAsMigratable: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/localization', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

const mockGetSession = supabase.auth.getSession as jest.Mock;
const mockSignInWithPassword = supabase.auth.signInWithPassword as jest.Mock;
const mockSignOut = supabase.auth.signOut as jest.Mock;
const mockSignUp = supabase.auth.signUp as jest.Mock;
const mockOnAuthStateChange = supabase.auth.onAuthStateChange as jest.Mock;
const mockUnsubscribe = jest.fn();

let queryClient: QueryClient;

const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
);

async function renderAuth() {
    const rendered = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(rendered.result.current.isLoading).toBe(false));
    return rendered;
}

describe('AuthProvider', () => {
    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
        });
        mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
        mockSignInWithPassword.mockResolvedValue({ error: null });
        mockSignOut.mockResolvedValue({ error: null });
        mockSignUp.mockResolvedValue({ data: { session: null, user: null }, error: null });
        mockOnAuthStateChange.mockReturnValue({
            data: { subscription: { unsubscribe: mockUnsubscribe } },
        });
    });

    afterEach(() => {
        queryClient.clear();
        jest.clearAllMocks();
    });

    it('signs a user in with their credentials', async () => {
        const { result, unmount } = await renderAuth();

        await act(async () => {
            await result.current.login('cook@example.com', 'Secure123');
        });

        expect(mockSignInWithPassword).toHaveBeenCalledWith({
            email: 'cook@example.com',
            password: 'Secure123',
        });
        unmount();
    });

    it('validates an email before attempting sign-up', async () => {
        const { result, unmount } = await renderAuth();

        await expect(result.current.register('not-an-email', 'Secure123')).rejects.toThrow(
            'Please enter a valid email address.'
        );

        expect(mockSignUp).not.toHaveBeenCalled();
        unmount();
    });

    it('signs the user out', async () => {
        const { result, unmount } = await renderAuth();

        await act(async () => {
            await result.current.logout();
        });

        expect(mockSignOut).toHaveBeenCalledWith();
        unmount();
    });

    it('restores the persisted session on startup', async () => {
        const restoredSession = {
            user: { id: 'user-1', email: 'cook@example.com' },
        } as Session;
        mockGetSession.mockResolvedValue({ data: { session: restoredSession }, error: null });

        const { result, unmount } = await renderAuth();

        expect(result.current.session).toBe(restoredSession);
        expect(result.current.user?.id).toBe('user-1');
        expect(tagLocalDataAsMigratable).toHaveBeenCalledWith('user-1');
        unmount();
    });
});
