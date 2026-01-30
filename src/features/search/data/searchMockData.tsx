import { Feather } from '@expo/vector-icons';

export type SearchFilterId = 'all' | 'recipes' | 'collections' | 'notes';
export type FeatherIconName = keyof typeof Feather.glyphMap;

export const SEARCH_FILTERS: Array<{ id: SearchFilterId; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'recipes', label: 'Recipes' },
  { id: 'collections', label: 'Folders' },
  { id: 'notes', label: 'Notes' },
];

export type BrowseCategory = {
  id: string;
  label: string;
  icon: FeatherIconName;
  tone: 'neutral' | 'sage';
};

export const BROWSE_CATEGORIES: BrowseCategory[] = [
  { id: 'quick-easy', label: 'Quick &\nEasy', icon: 'clock', tone: 'neutral' },
  { id: 'healthy', label: 'Healthy', icon: 'heart', tone: 'sage' },
  { id: 'comfort', label: 'Comfort\nFood', icon: 'coffee', tone: 'neutral' },
  { id: 'new-ideas', label: 'New\nIdeas', icon: 'star', tone: 'sage' },
];
