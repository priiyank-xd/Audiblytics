import type { CollectionWord } from '@/lib/schemas/collection.schema';

export type CollectionTab = 'all' | 'practicing' | 'mastered';

export function isPracticingEntry(entry: CollectionWord): boolean {
  return entry.reviewCount === 0 || entry.difficultyRating > 0;
}

export function isMasteredEntry(entry: CollectionWord): boolean {
  return entry.reviewCount >= 1 && entry.difficultyRating === 0;
}

export function filterCollectionByTab(
  entries: CollectionWord[],
  tab: CollectionTab,
): CollectionWord[] {
  if (tab === 'all') return entries;
  if (tab === 'practicing') return entries.filter(isPracticingEntry);
  return entries.filter(isMasteredEntry);
}

export function filterCollectionBySearch(
  entries: CollectionWord[],
  query: string,
): CollectionWord[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return entries;
  return entries.filter(
    (e) =>
      e.word.toLowerCase().includes(needle) || e.meaning.toLowerCase().includes(needle),
  );
}

export function countByTab(entries: CollectionWord[]): Record<CollectionTab, number> {
  return {
    all: entries.length,
    practicing: entries.filter(isPracticingEntry).length,
    mastered: entries.filter(isMasteredEntry).length,
  };
}
