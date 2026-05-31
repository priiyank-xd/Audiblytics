import type { RecordingWithTheme } from '@/features/voice-journal/use-recordings';
import type { RecordingListItem } from '@/lib/schemas/recording.schema';
import { db } from '@/lib/storage/db';
import { themeKeyToLabel } from '@/lib/ui/theme-key-label';
import { isWarmupRecordingParagraphId } from '@/lib/warmup-recording-id';

export async function enrichRecordingsWithTheme(
  rows: RecordingListItem[],
): Promise<RecordingWithTheme[]> {
  const paragraphIds = [...new Set(rows.map((r) => r.paragraphId))].filter(
    (id) => !isWarmupRecordingParagraphId(id),
  );
  const cacheById = new Map<string, { theme: string; ttsFallbackWord: string | null }>();
  await Promise.all(
    paragraphIds.map(async (id) => {
      const row = await db.paragraphCache.get(id);
      if (row) {
        const w = row.hardWords[0]?.word;
        cacheById.set(id, {
          theme: row.theme,
          ttsFallbackWord: typeof w === 'string' && w.length > 0 ? w : null,
        });
      }
    }),
  );

  return rows.map((r) => {
    if (isWarmupRecordingParagraphId(r.paragraphId)) {
      return { ...r, themeLabel: 'Warm-up', ttsFallbackWord: null };
    }
    const cached = cacheById.get(r.paragraphId);
    const themeLabel = cached ? themeKeyToLabel(cached.theme) : 'Unknown';
    const ttsFallbackWord = cached?.ttsFallbackWord ?? null;
    return { ...r, themeLabel, ttsFallbackWord };
  });
}
