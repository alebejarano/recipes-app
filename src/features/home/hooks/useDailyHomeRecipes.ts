import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

export const HOME_RECIPE_CYCLE_MS = 24 * 60 * 60 * 1000;
export const HOME_RECIPES_CACHE_KEY = 'home_recipe_sections_v2';

type RecipeIdentity = { id: string; title: string; createdAt: string; cloudId?: string | null; clientId?: string | null };
type Snapshot<T> = { createdAt: number; library: T[]; ideas: T[]; recent: T[] };

function parseSnapshot<T extends RecipeIdentity>(raw: string | null): Snapshot<T> | null {
    try {
        const value = JSON.parse(raw ?? 'null');
        const isRecipe = (item: unknown) => item && typeof item === 'object'
            && typeof (item as T).id === 'string' && typeof (item as T).title === 'string'
            && typeof (item as T).createdAt === 'string';
        if (!value || !Number.isFinite(value.createdAt) || value.createdAt > Date.now()
            || ![value.library, value.ideas, value.recent].every((items) => Array.isArray(items) && items.every(isRecipe))) return null;
        return value;
    } catch {
        return null;
    }
}

// Local IDs and server IDs describe the same recipe after sync. Keep the
// stored order while using the ID accepted by the current detail route.
function resolveSelection<T extends RecipeIdentity>(selection: T[], recipes: T[], settled: boolean) {
    return selection.flatMap((saved) => {
        const keys = [saved.id, saved.cloudId, saved.clientId].filter(Boolean);
        const current = recipes.find((recipe) => [recipe.id, recipe.cloudId, recipe.clientId]
            .some((id) => Boolean(id) && keys.includes(id)));
        if (current) return [{ ...saved, id: current.id }];
        return settled ? [] : [saved];
    });
}

export function useDailyHomeRecipes<T extends RecipeIdentity>(params: {
    scope: string;
    recipes: T[];
    ready: boolean;
    settled: boolean;
    buildIdeas: (recipes: T[], now: Date) => T[];
    buildRecent: (recipes: T[]) => T[];
}) {
    const { scope, recipes, ready, settled, buildIdeas, buildRecent } = params;
    const key = `${HOME_RECIPES_CACHE_KEY}:${scope}`;
    const [loaded, setLoaded] = useState<{ key: string; snapshot: Snapshot<T> | null } | null>(null);
    const [now, setNow] = useState(Date.now);
    const snapshot = loaded?.key === key ? loaded.snapshot : null;
    const hydrated = loaded?.key === key;
    const fresh = snapshot !== null && now - snapshot.createdAt < HOME_RECIPE_CYCLE_MS;

    useEffect(() => {
        let active = true;
        void AsyncStorage.getItem(key).then((raw) => {
            if (active) setLoaded({ key, snapshot: parseSnapshot<T>(raw) });
        }).catch(() => {
            if (active) setLoaded({ key, snapshot: null });
        });
        return () => { active = false; };
    }, [key]);

    useEffect(() => {
        const update = () => setNow(Date.now());
        const subscription = AppState.addEventListener('change', (state) => {
            if (state === 'active') update();
        });
        const timer = snapshot ? setTimeout(update, Math.max(1, snapshot.createdAt + HOME_RECIPE_CYCLE_MS - Date.now())) : null;
        return () => {
            subscription.remove();
            if (timer !== null) clearTimeout(timer);
        };
    }, [snapshot]);

    useEffect(() => {
        if (!hydrated || fresh || !ready || !settled || recipes.length === 0) return;
        let active = true;
        const createdAt = Date.now();
        const next = { createdAt, library: recipes, ideas: buildIdeas(recipes, new Date(createdAt)), recent: buildRecent(recipes) };
        const persist = async () => {
            try {
                await AsyncStorage.setItem(key, JSON.stringify(next));
            } catch {
                // Retain the selection for this session when device storage fails.
            }
            if (active) {
                setLoaded({ key, snapshot: next });
                setNow(createdAt);
            }
        };
        void persist();
        return () => { active = false; };
    }, [buildIdeas, buildRecent, fresh, hydrated, key, ready, recipes, settled]);

    return {
        ready: hydrated && (snapshot !== null || (ready && settled && recipes.length === 0)),
        cachedLibrary: snapshot?.library ?? [],
        ideas: resolveSelection(snapshot?.ideas ?? [], recipes, settled),
        recent: resolveSelection(snapshot?.recent ?? [], recipes, settled),
    };
}
