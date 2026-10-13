import { loadServerParagraphUtcDates } from './paragraph-dates-server-cache';

/** UTC `YYYY-MM-DD` keys for generated paragraphs (server). Empty set on API failure. */
export async function loadParagraphCacheUtcDateSet(): Promise<ReadonlySet<string>> {
  try {
    return await loadServerParagraphUtcDates();
  } catch (e) {
    console.warn('[calendar] paragraph dates API fetch failed', e);
    return new Set();
  }
}
