import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { HOME_RECIPES_CACHE_KEY, HOME_RECIPE_CYCLE_MS, useDailyHomeRecipes } from '@/features/home/hooks/useDailyHomeRecipes';

const recipe = (id: string, extra = {}) => ({ id, title: `Recipe ${id}`, createdAt: '2026-11-16T12:00:00Z', ...extra });
const scope = 'auth:user-1';
const key = `${HOME_RECIPES_CACHE_KEY}:${scope}`;
const initial = [recipe('a'), recipe('b'), recipe('c')];

function params(recipes = initial) {
    return {
        scope, recipes, ready: true, settled: true,
        buildIdeas: jest.fn((items: typeof initial) => items.slice(0, 2)),
        buildRecent: jest.fn((items: typeof initial) => items.slice(-2)),
    };
}

describe('persisted Home recipe cycle', () => {
    beforeEach(async () => {
        await AsyncStorage.clear();
    });
    afterEach(() => {
        jest.restoreAllMocks();
        jest.useRealTimers();
    });

    it('restores both sections after a cold mount without selecting again or swapping during fetching', async () => {
        const first = await renderHook(() => useDailyHomeRecipes(params()));
        await waitFor(() => expect(first.result.current.ready).toBe(true));
        await waitFor(() => expect(AsyncStorage.getItem(key)).resolves.not.toBeNull());
        await first.unmount();

        const next = params([...initial].reverse());
        const second = await renderHook(({ settled }: { settled: boolean }) => useDailyHomeRecipes({ ...next, settled }), { initialProps: { settled: false } });
        await waitFor(() => expect(second.result.current.ready).toBe(true));
        expect(second.result.current.ideas.map((item) => item.id)).toEqual(['a', 'b']);
        expect(second.result.current.recent.map((item) => item.id)).toEqual(['b', 'c']);
        await second.rerender({ settled: true });
        expect(next.buildIdeas).not.toHaveBeenCalled();
        expect(next.buildRecent).not.toHaveBeenCalled();
        expect(second.result.current.ideas.map((item) => item.id)).toEqual(['a', 'b']);
    });

    it('keeps local selections when sync replaces IDs with server IDs', async () => {
        await AsyncStorage.setItem(key, JSON.stringify({
            createdAt: Date.now(), library: initial,
            ideas: [recipe('local-a', { cloudId: 'server-a' })],
            recent: [recipe('local-b')],
        }));
        const { result } = await renderHook(() => useDailyHomeRecipes(params([
            recipe('server-a'), recipe('server-b', { clientId: 'local-b' }),
        ])));
        await waitFor(() => expect(result.current.ready).toBe(true));
        expect(result.current.ideas[0].id).toBe('server-a');
        expect(result.current.recent[0].id).toBe('server-b');
    });

    it('expires after 24 elapsed hours, including across a restart', async () => {
        const createdAt = Date.now();
        await AsyncStorage.setItem(key, JSON.stringify({ createdAt, library: initial, ideas: [initial[0]], recent: [initial[0]] }));
        jest.spyOn(Date, 'now').mockReturnValue(createdAt + HOME_RECIPE_CYCLE_MS);
        const next = params([...initial].reverse());
        const { result } = await renderHook(() => useDailyHomeRecipes(next));
        await waitFor(() => expect(next.buildIdeas).toHaveBeenCalledTimes(1));
        expect(result.current.ideas.map((item) => item.id)).toEqual(['c', 'b']);
        expect(result.current.recent.map((item) => item.id)).toEqual(['b', 'a']);
    });

    it('waits for the library to settle before saving the first selection', async () => {
        const next = params();
        const { result, rerender } = await renderHook(({ settled }: { settled: boolean }) => useDailyHomeRecipes({ ...next, settled }), { initialProps: { settled: false } });
        expect(result.current.ready).toBe(false);
        expect(next.buildIdeas).not.toHaveBeenCalled();
        await rerender({ settled: true });
        await waitFor(() => expect(result.current.ready).toBe(true));
        expect(next.buildIdeas).toHaveBeenCalledTimes(1);
    });

    it('keeps the same selection across midnight until 24 hours have elapsed', async () => {
        const createdAt = new Date('2026-11-16T23:30:00Z').getTime();
        jest.spyOn(Date, 'now').mockReturnValue(createdAt + 60 * 60 * 1000);
        await AsyncStorage.setItem(key, JSON.stringify({ createdAt, library: initial, ideas: [initial[0]], recent: [initial[1]] }));
        const next = params([...initial].reverse());
        const { result } = await renderHook(() => useDailyHomeRecipes(next));
        await waitFor(() => expect(result.current.ready).toBe(true));
        expect(result.current.ideas[0].id).toBe('a');
        expect(result.current.recent[0].id).toBe('b');
        expect(next.buildIdeas).not.toHaveBeenCalled();
    });

    it('refreshes after 24 hours while Home remains mounted', async () => {
        jest.useFakeTimers();
        const createdAt = Date.now();
        await AsyncStorage.setItem(key, JSON.stringify({ createdAt, library: initial, ideas: [initial[0]], recent: [initial[0]] }));
        const next = params([...initial].reverse());
        const { result } = await renderHook(() => useDailyHomeRecipes(next));
        await waitFor(() => expect(result.current.ready).toBe(true));
        await act(async () => { jest.advanceTimersByTime(HOME_RECIPE_CYCLE_MS); });
        await waitFor(() => expect(next.buildIdeas).toHaveBeenCalledTimes(1));
        expect(result.current.ideas[0].id).toBe('c');
    });

    it('rebuilds a corrupt cache after hydration', async () => {
        await AsyncStorage.setItem(key, '{invalid');
        const next = params();
        const { result } = await renderHook(() => useDailyHomeRecipes(next));
        await waitFor(() => expect(result.current.ready).toBe(true));
        expect(result.current.ideas.map((item) => item.id)).toEqual(['a', 'b']);
    });

    it('does not lock a new empty library for 24 hours', async () => {
        const next = params();
        const { result, rerender } = await renderHook(({ recipes }: { recipes: typeof initial }) => useDailyHomeRecipes({ ...next, recipes }), { initialProps: { recipes: [] as typeof initial } });
        await waitFor(() => expect(result.current.ready).toBe(true));
        expect(await AsyncStorage.getItem(key)).toBeNull();
        await rerender({ recipes: initial });
        await waitFor(() => expect(result.current.ideas).toHaveLength(2));
    });

    it('removes a deleted recipe without filling its slot or reordering other cards', async () => {
        await AsyncStorage.setItem(key, JSON.stringify({ createdAt: Date.now(), library: initial, ideas: initial, recent: initial }));
        const { result } = await renderHook(() => useDailyHomeRecipes(params([initial[0], initial[2]])));
        await waitFor(() => expect(result.current.ready).toBe(true));
        expect(result.current.ideas.map((item) => item.id)).toEqual(['a', 'c']);
    });

    it('isolates selections between accounts', async () => {
        const first = await renderHook(() => useDailyHomeRecipes(params()));
        await waitFor(() => expect(first.result.current.ready).toBe(true));
        const next = { ...params([recipe('other')]), scope: 'auth:user-2' };
        const second = await renderHook(() => useDailyHomeRecipes(next));
        await waitFor(() => expect(second.result.current.ready).toBe(true));
        expect(second.result.current.ideas.map((item) => item.id)).toEqual(['other']);
    });
});
