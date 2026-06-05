import { isApiStorageBackend } from '@/lib/config/storage-backend';
import { formatUtcDate } from '@/lib/day-counter/format-utc-date';
import { db } from '@/lib/storage/db';

import { loadServerParagraphUtcDates } from './paragraph-dates-server-cache';

/** Union Dexie + optional server UTC date sets (BVR16). */
export function mergeParagraphUtcDateSets(
  ...sources: ReadonlyArray<Iterable<string>>
): ReadonlySet<string> {
  const dates = new Set<string>();
  for (const source of sources) {
    for (const date of source) {
      dates.add(date);
    }
  }
  return dates;
}

export async function loadDexieParagraphCacheUtcDateSet(): Promise<ReadonlySet<string>> {
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

/** UTC `YYYY-MM-DD` keys for paragraph cache (Dexie ∪ server in API mode). */
export async function loadParagraphCacheUtcDateSet(): Promise<ReadonlySet<string>> {
  const localDates = await loadDexieParagraphCacheUtcDateSet();

  if (!isApiStorageBackend()) {
    return localDates;
  }

  try {
    const serverDates = await loadServerParagraphUtcDates();
    return mergeParagraphUtcDateSets(localDates, serverDates);
  } catch (e) {
    console.warn('[calendar] paragraph dates API fetch failed; Dexie only', e);
    return localDates;
  }
}
