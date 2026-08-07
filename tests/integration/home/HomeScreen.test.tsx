import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

import HomeScreen from '@/features/home/screens/HomeScreen';
import { useStrategyNotesList } from '@/features/notes/hooks/useStrategyNotes';
import { useRecipeDocumentUsageSummary } from '@/features/recipes/hooks/useRecipeDocuments';
import { useManagedImports } from '@/features/recipes/hooks/useManagedImports';
import { useStrategyRecipesList } from '@/features/recipes/hooks/useStrategyRecipes';
import { useStorageDataMode } from '@/features/storage/hooks/useStorageDataMode';

jest.mock('@expo/vector-icons', () => ({ Feather: () => null, Ionicons: () => null }));
jest.mock('expo-image', () => ({ Image: { prefetch: jest.fn() } }));
jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn().mockResolvedValue(null), setItemAsync: jest.fn() }));
jest.mock('@react-native-async-storage/async-storage', () => ({
    __esModule: true,
    default: { getItem: jest.fn().mockResolvedValue(null), setItem: jest.fn().mockResolvedValue(undefined) },
}));
jest.mock('expo-router', () => ({
    router: { push: jest.fn() },
    useFocusEffect: jest.fn(),
    useSegments: () => ['(auth)'],
}));
jest.mock('@/components/Screen', () => ({ __esModule: true, default: ({ children }: { children: ReactNode }) => <>{children}</> }));
jest.mock('@/features/home/components/HomeHeader', () => ({ __esModule: true, default: () => {
    const { Text: MockText } = require('react-native');
    return <MockText>home-header</MockText>;
} }));
jest.mock('@/features/home/components/EmptyHomeCard', () => ({
    __esModule: true,
    default: ({ title, primaryLabel, onPressPrimary }: { title: string; primaryLabel: string; onPressPrimary: () => void }) => {
        const { Pressable: MockPressable, Text: MockText, View: MockView } = require('react-native');
        return <MockView><MockText>{title}</MockText><MockPressable onPress={onPressPrimary}><MockText>{primaryLabel}</MockText></MockPressable></MockView>;
    },
}));
jest.mock('@/features/home/components/PickCard', () => ({ __esModule: true, default: ({ title }: { title: string }) => {
    const { Text: MockText } = require('react-native');
    return <MockText>{title}</MockText>;
} }));
jest.mock('@/features/home/components/SectionHeaderRow', () => ({ __esModule: true, default: ({ title }: { title: string }) => {
    const { Text: MockText } = require('react-native');
    return <MockText>{title}</MockText>;
} }));
jest.mock('@/features/home/components/RecipeCarousel', () => ({
    __esModule: true,
    default: ({ items }: { items: { id: string; title: string }[] }) => {
        const { Text: MockText } = require('react-native');
        return <>{items.map((item) => <MockText key={item.id}>{item.title}</MockText>)}</>;
    },
}));
jest.mock('@/features/home/components/RecentActivityList', () => ({
    __esModule: true,
    default: ({ items }: { items: { id: string; title: string }[] }) => {
        const { Text: MockText } = require('react-native');
        return <>{items.map((item) => <MockText key={item.id}>{item.title}</MockText>)}</>;
    },
}));
jest.mock('@/features/home/components/ActionCard', () => ({ __esModule: true, default: ({ title }: { title: string }) => {
    const { Text: MockText } = require('react-native');
    return <MockText>{title}</MockText>;
} }));
jest.mock('@/features/home/components/FolderSpotlightCard', () => ({ __esModule: true, default: ({ title }: { title: string }) => {
    const { Text: MockText } = require('react-native');
    return <MockText>{title}</MockText>;
} }));
jest.mock('@/features/home/components/SuccessBanner', () => ({ __esModule: true, default: () => null }));
jest.mock('@/features/auth/context/AuthContext', () => ({ useAuth: () => ({ user: null }) }));
jest.mock('@/features/analytics/events', () => ({ useAnalyticsCapture: () => jest.fn() }));
jest.mock('@/hooks/useTabBarBottomPadding', () => ({ useTabBarBottomPadding: () => 0 }));
jest.mock('@/localization', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('@/localization/i18n', () => ({ i18n: { t: (key: string) => key } }));
jest.mock('@/features/recipes/hooks/useStrategyRecipes', () => ({ useStrategyRecipesList: jest.fn() }));
jest.mock('@/features/notes/hooks/useStrategyNotes', () => ({ useStrategyNotesList: jest.fn() }));
jest.mock('@/features/recipes/hooks/useManagedImports', () => ({ useManagedImports: jest.fn() }));
jest.mock('@/features/recipes/hooks/useRecipeDocuments', () => ({ useRecipeDocumentUsageSummary: jest.fn() }));
jest.mock('@/features/storage/hooks/useStorageDataMode', () => ({ useStorageDataMode: jest.fn() }));
jest.mock('@/features/shopping-list/store/useShoppingListStore', () => ({
    useShoppingListStore: (selector: (state: Record<string, unknown>) => unknown) => selector({
        hydrate: jest.fn(), isHydrated: true, isHydrating: false, listId: null, items: [],
    }),
}));

const mockRecipes = useStrategyRecipesList as jest.Mock;
const mockNotes = useStrategyNotesList as jest.Mock;
const mockImports = useManagedImports as jest.Mock;
const mockImportUsage = useRecipeDocumentUsageSummary as jest.Mock;
const mockStorageMode = useStorageDataMode as jest.Mock;
const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

function recipe(id: string) {
    return {
        id,
        title: `Recipe ${id}`,
        createdAt: '2026-08-01T12:00:00.000Z',
        updatedAt: '2026-08-01T12:00:00.000Z',
        folders: [],
        mealTimes: [],
    };
}

describe('<HomeScreen /> state rendering', () => {
    beforeEach(() => {
        mockAsyncStorage.getItem.mockResolvedValue(null);
        mockAsyncStorage.setItem.mockResolvedValue();
        mockSecureStore.getItemAsync.mockResolvedValue(null);
        mockSecureStore.setItemAsync.mockResolvedValue();
        mockStorageMode.mockReturnValue({ isStorageModeReady: true });
        mockRecipes.mockReturnValue({ data: [], isLoading: false });
        mockNotes.mockReturnValue({ data: [], isLoading: false });
        mockImports.mockReturnValue({ data: [], isLoading: false });
        mockImportUsage.mockReturnValue({ data: { totalCount: 0, totalBytes: 0 } });
    });

    afterEach(() => jest.clearAllMocks());

    it('shows loading until storage and recipes are ready', async () => {
        mockStorageMode.mockReturnValue({ isStorageModeReady: false });
        mockRecipes.mockReturnValue({ data: undefined, isLoading: true });

        const { getByText, queryByText } = await render(<HomeScreen mode="auth" />);
        expect(getByText('home.loading')).toBeVisible();
        expect(queryByText('home.empty.title')).toBeNull();
    });

    it('shows the empty state with no user content', async () => {
        const { getByText } = await render(<HomeScreen mode="auth" />);
        expect(getByText('home.empty.title')).toBeVisible();
    });

    it('shows the recipe call-to-action and activity for a notes-only library', async () => {
        mockNotes.mockReturnValue({ data: [{ id: 'note-1', title: 'Shopping ideas', createdAt: '2026-08-02T12:00:00.000Z', updatedAt: '2026-08-02T12:00:00.000Z' }] });

        const { getByText } = await render(<HomeScreen mode="auth" />);
        expect(getByText('home.activity.recipeCtaTitle')).toBeVisible();
        expect(getByText('Shopping ideas')).toBeVisible();
    });

    it('shows the recipe call-to-action and activity for an imports-only library', async () => {
        mockImports.mockReturnValue({
            data: [{ id: 'import-1', fileName: 'Pasta.pdf', createdAt: '2026-08-02T12:00:00.000Z' }],
            isLoading: false,
        });
        mockImportUsage.mockReturnValue({ data: { totalCount: 1, totalBytes: 200 } });

        const { getByText } = await render(<HomeScreen mode="auth" />);
        expect(getByText('home.activity.recipeCtaTitle')).toBeVisible();
        expect(getByText('Pasta.pdf')).toBeVisible();
    });

    it('shows first recipes for a starter library', async () => {
        mockRecipes.mockReturnValue({ data: [recipe('1')], isLoading: false });

        const { getAllByText, getByText } = await render(<HomeScreen mode="auth" />);
        expect(getByText('home.sections.firstRecipes')).toBeVisible();
        expect(getAllByText('Recipe 1')).not.toHaveLength(0);
    });

    it('keeps five recipes in the starter-library layout', async () => {
        mockRecipes.mockReturnValue({ data: Array.from({ length: 5 }, (_, index) => recipe(String(index + 1))), isLoading: false });

        const { getByText } = await render(<HomeScreen mode="auth" />);
        expect(getByText('home.sections.firstRecipes')).toBeVisible();
    });

    it('shows recently added recipes for an established library', async () => {
        mockRecipes.mockReturnValue({ data: Array.from({ length: 6 }, (_, index) => recipe(String(index + 1))), isLoading: false });

        const { getByText } = await render(<HomeScreen mode="auth" />);
        expect(getByText('home.sections.recentlyAdded')).toBeVisible();
        expect(getByText('Recipe 6')).toBeVisible();
    });

    it('keeps nineteen recipes in the established-library layout without duplicate recent sections', async () => {
        mockRecipes.mockReturnValue({ data: Array.from({ length: 19 }, (_, index) => recipe(String(index + 1))), isLoading: false });

        const { getAllByText } = await render(<HomeScreen mode="auth" />);
        expect(getAllByText('home.sections.recentlyAdded')).toHaveLength(1);
    });

    it('uses a generic meal-time hero when no recipe matches the current meal', async () => {
        mockRecipes.mockReturnValue({ data: Array.from({ length: 6 }, (_, index) => recipe(String(index + 1))), isLoading: false });

        const { getByText } = await render(<HomeScreen mode="auth" />);
        expect(getByText('Recipe 6')).toBeVisible();
    });

    it('shows weekly ideas for a large library', async () => {
        mockRecipes.mockReturnValue({ data: Array.from({ length: 20 }, (_, index) => recipe(String(index + 1))), isLoading: false });

        const { getByText } = await render(<HomeScreen mode="auth" />);
        await waitFor(() => expect(getByText('home.sections.ideas')).toBeVisible());
    });

    it('shows and persists dismissal of the public local-storage banner', async () => {
        mockRecipes.mockReturnValue({ data: [recipe('1')], isLoading: false });

        const { getAllByLabelText, getByText, queryByText } = await render(<HomeScreen mode="public" />);
        await waitFor(() => expect(getByText('home.banners.localOnlyTitle')).toBeVisible());

        await act(async () => {
            fireEvent.press(getAllByLabelText('home.banners.dismissStorageInfoA11y')[0]);
            await Promise.resolve();
        });

        await waitFor(() => expect(queryByText('home.banners.localOnlyTitle')).toBeNull());
        expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('storage_banner_dismissed', 'true');
    });

    it('prioritizes the public storage-risk banner when a device marker changes', async () => {
        mockSecureStore.getItemAsync.mockResolvedValue('device-1');

        const { getByText, queryByText } = await render(<HomeScreen mode="public" />);
        await waitFor(() => expect(getByText('home.banners.storageUpdateTitle')).toBeVisible());
        expect(queryByText('home.banners.localOnlyTitle')).toBeNull();
    });

    it('shows the conversion banner after its public-library threshold is reached', async () => {
        mockRecipes.mockReturnValue({ data: Array.from({ length: 80 }, (_, index) => recipe(String(index + 1))), isLoading: false });

        const { getByText } = await render(<HomeScreen mode="public" />);
        await waitFor(() => expect(getByText('home.conversion.title')).toBeVisible());
    });

    it.each([
        ['public', '/(public)/create'],
        ['auth', '/(auth)/create'],
    ] as const)('routes the empty-state create action in %s mode', async (mode, expectedRoute) => {
        const { getByText } = await render(<HomeScreen mode={mode} />);

        fireEvent.press(getByText('home.empty.primary'));

        expect(router.push).toHaveBeenCalledWith(expectedRoute);
    });
});
