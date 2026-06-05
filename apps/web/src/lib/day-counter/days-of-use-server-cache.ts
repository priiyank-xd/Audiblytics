import { fetchDaysOfUse } from '@/lib/api/days-of-use';

let cachedServerDays: readonly string[] | null = null;
let inflight: Promise<readonly string[]> | null = null;

export function invalidateServerDaysOfUseCache(): void {
  cachedServerDays = null;
  inflight = null;
}

export function getCachedServerDaysOfUse(): readonly string[] {
  return cachedServerDays ?? [];
}

/** Idempotent add after successful POST /days-of-use (avoids invalidate race). */
export function appendServerDaysOfUseCache(utcDate: string): void {
  if (cachedServerDays === null) {
    cachedServerDays = [utcDate];
    return;
  }
  if (!cachedServerDays.includes(utcDate)) {
    cachedServerDays = [...cachedServerDays, utcDate].sort();
  }
}

export async function loadServerDaysOfUse(): Promise<readonly string[]> {
  if (cachedServerDays) {
    return cachedServerDays;
  }
  if (inflight) {
    return inflight;
  }

  inflight = fetchDaysOfUse()
    .then((dates) => {
      cachedServerDays = dates;
      inflight = null;
      return cachedServerDays;
    })
    .catch((error) => {
      inflight = null;
      throw error;
    });

  return inflight;
}
