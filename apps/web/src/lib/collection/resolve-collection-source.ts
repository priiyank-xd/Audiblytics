import type { CollectionWord } from '@/lib/schemas/collection.schema';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

function formatSavedLocalDate(isoUtc: string): string {
  const date = new Date(isoUtc);
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export type CollectionSourceContext = {
  theme?: string;
  dayOfUse?: number;
};

/** Display label for "Saved from" / source line on collection detail. */
export function resolveCollectionSourceLabel(
  entry: CollectionWord,
  context?: CollectionSourceContext,
): string {
  if (!entry.sourceParagraphId) {
    return `Saved ${formatSavedLocalDate(entry.savedAt)}`;
  }

  const theme = context?.theme;
  const day = context?.dayOfUse;

  if (theme && day != null) return `${theme} · Day ${day}`;
  if (theme) return theme;
  return `Saved ${formatSavedLocalDate(entry.savedAt)}`;
}
