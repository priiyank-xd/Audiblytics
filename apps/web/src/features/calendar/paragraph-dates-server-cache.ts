import { fetchParagraphDates } from '@/lib/api/paragraphs';

let cachedServerDates: ReadonlySet<string> | null = null;
let inflight: Promise<ReadonlySet<string>> | null = null;

/** Clears deduped server dates cache (call before reload). */
export function invalidateServerParagraphUtcDatesCache(): void {
  cachedServerDates = null;
  inflight = null;
}

/**
 * Loads server paragraph UTC dates once per cache generation.
 * Concurrent callers share the same in-flight request.
 */
export async function loadServerParagraphUtcDates(): Promise<ReadonlySet<string>> {
  if (cachedServerDates) {
    return cachedServerDates;
  }
  if (inflight) {
    return inflight;
  }

  inflight = fetchParagraphDates()
    .then((dates) => {
      cachedServerDates = new Set(dates);
      inflight = null;
      return cachedServerDates;
    })
    .catch((error) => {
      inflight = null;
      throw error;
    });

  return inflight;
}
