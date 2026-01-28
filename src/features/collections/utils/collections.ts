import { theme } from '@/styles/theme';
import type { CollectionItem, CollectionTileVariant, Recipe, SegmentKey } from '../types';

export function buildCollectionsForSegment(
  segment: SegmentKey,
  recipes: Recipe[]
): CollectionItem[] {
  // For now, your screenshots correspond to the Recipes segment.
  if (segment !== 'recipes') {
    return [{ key: 'new', label: 'New Collection', count: 0, kind: 'new' }];
  }

  const map = new Map<string, number>();

  for (const recipe of recipes) {
    const tags = recipe.tags?.map((tag) => tag.trim()).filter(Boolean) ?? [];

    if (tags.length === 0) {
      map.set('Uncategorized', (map.get('Uncategorized') ?? 0) + 1);
      continue;
    }

    for (const tag of tags) {
      map.set(tag, (map.get(tag) ?? 0) + 1);
    }
  }

  const items: CollectionItem[] = Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([label, count]) => ({
      key: label,
      label,
      count,
      kind: 'tag',
    }));

  // Always add “New Collection” tile at the end
  items.push({ key: 'new', label: 'New Collection', count: 0, kind: 'new' });

  return items;
}

export function getCollectionsHelperText(segment: SegmentKey): string {
  if (segment === 'recipes') return 'Recipes are grouped automatically based on tags';
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
  if (normalized.includes('dinner')) return 'sage';
  if (normalized.includes('lunch')) return 'mint';
  if (normalized.includes('vegan')) return 'mint';
  if (normalized.includes('quick')) return 'butter';

  const fallback: CollectionTileVariant[] = ['sage', 'mint', 'warm', 'pink', 'butter'];
  return fallback[index % fallback.length];
}

export function getVariantStyle(variant: CollectionTileVariant) {
  // Keep “design tokens” centralized here.
  // If you add more theme colors later, adjust only this function.
  switch (variant) {
    case 'sage':
      return {
        backgroundColor: theme.colors.sageLight,
        ghostColor: theme.colors.sage,
      };
    case 'mint':
      return {
        backgroundColor: theme.colors.muted,
        ghostColor: theme.colors.sage,
      };
    case 'warm':
      return {
        backgroundColor: theme.colors.creamDark,
        ghostColor: theme.colors.terracotta,
      };
    case 'pink':
      return {
        // If you have a dedicated soft pink/peach token, use it here.
        backgroundColor: theme.colors.creamDark,
        ghostColor: theme.colors.terracotta,
      };
    case 'butter':
      return {
        backgroundColor: theme.colors.creamDark,
        ghostColor: theme.colors.accent,
      };
  }
}
