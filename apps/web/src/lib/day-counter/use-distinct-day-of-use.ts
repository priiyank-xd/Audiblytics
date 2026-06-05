'use client';

import { distinctDaysFromMerged } from '@/lib/day-counter/merge-days-of-use';
import { useServerDaysOfUse } from '@/lib/day-counter/use-server-days-of-use';
import { isApiStorageBackend } from '@/lib/config/storage-backend';
import { useLocalStorage } from '@/lib/storage/use-local-storage';
import { daysOfUseSchema } from '@/lib/schemas/days-of-use.schema';

/**
 * Reactive count of distinct UTC days recorded (NFR12 / AR13).
 * API mode: server list ∪ localStorage (local fallback while server loads).
 */
export function useDistinctDayOfUse(): number {
  const apiMode = isApiStorageBackend();
  const [localDays] = useLocalStorage('audiblytics.daysOfUse', daysOfUseSchema.parse([]), daysOfUseSchema);
  const serverDays = useServerDaysOfUse();

  if (!apiMode) {
    return new Set(localDays).size;
  }

  if (serverDays === undefined) {
    return new Set(localDays).size;
  }

  return distinctDaysFromMerged(localDays, serverDays);
}
