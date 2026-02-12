export type SegmentKey = 'recipes' | 'notes' | 'shopping';
export type RecipeSegmentKey = 'folders' | 'documents';

export type Recipe = {
  id: string;
  title: string;
  folders?: { id: string; name: string; emoji: string }[];
};

export type CollectionKind = 'tag' | 'new';

export type CollectionItem = {
  key: string;
  label: string;
  count: number;
  kind: CollectionKind;
  emoji?: string;
};

export type CollectionTileVariant = 'primary' | 'mint' | 'warm' | 'pink' | 'butter';
