import { Feather } from '@expo/vector-icons';

export type SearchFilterId = 'all' | 'recipes' | 'collections' | 'notes';
export type FeatherIconName = keyof typeof Feather.glyphMap;

export const SEARCH_FILTERS: { id: SearchFilterId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'recipes', label: 'Recipes' },
  { id: 'collections', label: 'Folders' },
  { id: 'notes', label: 'Notes' },
];

export type BrowseCategory = {
  id: string;
  label: string;
  icon: FeatherIconName;
};

export const BROWSE_CATEGORIES: BrowseCategory[] = [
  { id: 'quick-easy', label: 'Quick &\nEasy', icon: 'clock' },
  { id: 'healthy', label: 'Healthy', icon: 'heart' },
  { id: 'comfort', label: 'Comfort\nFood', icon: 'coffee' },
  { id: 'new-ideas', label: 'New\nIdeas', icon: 'star' },
];
