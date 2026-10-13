import type { RecordingWithTheme } from '@/features/voice-journal/use-recordings';
import type { CachedParagraph } from '@/lib/schemas/paragraph-cache.schema';
import type { RecordingListItem } from '@/lib/schemas/recording.schema';
import { fetchParagraphByUtcDate } from '@/lib/api/paragraphs';
import { formatUtcDate } from '@/lib/day-counter/format-utc-date';
import { themeKeyToLabel } from '@/lib/ui/theme-key-label';
import { isWarmupRecordingParagraphId } from '@/lib/warmup-recording-id';

/** Resolves theme labels per recording by fetching the paragraph for each distinct recording UTC date. */
export async function enrichRecordingsWithTheme(
  rows: RecordingListItem[],
): Promise<RecordingWithTheme[]> {
  const dates = [...new Set(rows.map((r) => formatUtcDate(new Date(r.recordingDate))))];
  const byDate = new Map<string, CachedParagraph | null>();
  await Promise.all(
    dates.map(async (d) => {
      try {
        byDate.set(d, await fetchParagraphByUtcDate(d));
      } catch (e) {
        console.warn('[voice-journal] paragraph lookup failed', d, e);
        byDate.set(d, null);
      }
    }),
  );

  return rows.flatMap((r) =>
    enrichRecordingsForArchivedDay([r], byDate.get(formatUtcDate(new Date(r.recordingDate))) ?? null),
  );
}

/** Theme labels from a single archived-day paragraph. */
export function enrichRecordingsForArchivedDay(
  rows: RecordingListItem[],
  cached: CachedParagraph | null,
): RecordingWithTheme[] {
  const themeLabel = cached ? themeKeyToLabel(cached.theme) : 'Unknown';
  const w = cached?.hardWords[0]?.word;
  const ttsFallbackWord = typeof w === 'string' && w.length > 0 ? w : null;

  return rows.map((r) => {
    if (isWarmupRecordingParagraphId(r.paragraphId)) {
      return { ...r, themeLabel: 'Warm-up', ttsFallbackWord: null };
    }
    return { ...r, themeLabel, ttsFallbackWord };
  });
}
