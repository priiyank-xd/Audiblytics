import { formatUtcDate } from '@/lib/day-counter/format-utc-date';
import { db } from '@/lib/storage/db';

/** UTC `YYYY-MM-DD` keys for each `paragraphCache` row (latest row wins per day elsewhere). */
export async function loadParagraphCacheUtcDateSet(): Promise<ReadonlySet<string>> {
  if (typeof indexedDB === 'undefined') {
    return new Set();
  }

  const rows = await db.paragraphCache.toArray();
  const dates = new Set<string>();
  for (const row of rows) {
    dates.add(formatUtcDate(new Date(row.generatedAt)));
  }
  return dates;
}
