import { theme } from '@/styles/theme';
import type { CollectionItem, CollectionTileVariant, Recipe, SegmentKey } from '../types';

export function buildCollectionsForSegment(
  segment: SegmentKey,
  recipes: Recipe[]
): CollectionItem[] {
  // For now, your screenshots correspond to the Recipes segment.
  if (segment !== 'recipes') {
    return [{ key: 'new', label: 'Create folder', count: 0, kind: 'new' }];
  }

  const map = new Map<string, { count: number; emoji?: string }>();

  for (const recipe of recipes) {
    const folders =
      recipe.folders?.map((folder) => ({
        name: folder.name.trim(),
        emoji: folder.emoji,
      })).filter((folder) => folder.name) ?? [];

    if (folders.length === 0) {
      const current = map.get('Uncategorized');
      map.set('Uncategorized', { count: (current?.count ?? 0) + 1 });
      continue;
    }

    for (const folder of folders) {
      const current = map.get(folder.name);
      map.set(folder.name, {
        count: (current?.count ?? 0) + 1,
        emoji: current?.emoji ?? folder.emoji,
      });
    }
  }

  const items: CollectionItem[] = Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([label, data]) => ({
      key: label,
      label,
      count: data.count,
      kind: 'tag',
      emoji: data.emoji,
    }));

  // Always add “Create folder” tile at the end
  items.push({ key: 'new', label: 'Create folder', count: 0, kind: 'new' });

  return items;
}

export function getCollectionsHelperText(segment: SegmentKey): string {
  if (segment === 'recipes') return 'Your recipes organized by folders';
  if (segment === 'notes') return 'Keep notes by topic, ingredients, or ideas';
  return 'Your current shopping list in one place';
}

export function pickEmoji(label: string): string {
  const s = label.toLowerCase();
  if (s.includes('breakfast')) return '🌅';
  if (s.includes('dessert')) return '🍰';
  if (s.includes('dinner')) return '🍽️';
  if (s.includes('lunch')) return '🥗';
  if (s.includes('vegan')) return '🌱';
  if (s.includes('quick')) return '⚡️';
  return '🥣';
}

/**
 * Soft tint mapping similar to your screenshots.
 * Adjust this mapping any time without touching UI components.
 */
export function pickVariant(label: string, index: number): CollectionTileVariant {
  const normalized = label.toLowerCase();

  if (normalized.includes('breakfast')) return 'warm';
  if (normalized.includes('dessert')) return 'pink';
  if (normalized.includes('dinner')) return 'primary';
  if (normalized.includes('lunch')) return 'mint';
  if (normalized.includes('vegan')) return 'mint';
  if (normalized.includes('quick')) return 'butter';

  const fallback: CollectionTileVariant[] = ['primary', 'mint', 'warm', 'pink', 'butter'];
  return fallback[index % fallback.length];
}

export function getVariantStyle(variant: CollectionTileVariant) {
  // Keep “design tokens” centralized here.
  // If you add more theme colors later, adjust only this function.
  switch (variant) {
    case 'primary':
      return {
        backgroundColor: theme.colors.primarySoft,
        ghostColor: theme.colors.primary,
      };
    case 'mint':
      return {
        backgroundColor: theme.colors.muted,
        ghostColor: theme.colors.primary,
      };
    case 'warm':
      return {
        backgroundColor: theme.colors.creamDark,
        ghostColor: theme.colors.accent,
      };
    case 'pink':
      return {
        // If you have a dedicated soft pink/peach token, use it here.
        backgroundColor: theme.colors.creamDark,
        ghostColor: theme.colors.accent,
      };
    case 'butter':
      return {
        backgroundColor: theme.colors.creamDark,
        ghostColor: theme.colors.accent,
      };
  }
}
