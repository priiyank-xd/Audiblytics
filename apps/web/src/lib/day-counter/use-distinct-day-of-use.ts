'use client';

import { useServerDaysOfUse } from '@/lib/day-counter/use-server-days-of-use';

/** Reactive count of distinct UTC days recorded (NFR12 / AR13), from the server. */
export function useDistinctDayOfUse(): number {
  return new Set(useServerDaysOfUse() ?? []).size;
}
