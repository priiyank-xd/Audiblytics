'use client';

import { useLocalStorage } from '@/lib/storage/use-local-storage';
import { daysOfUseSchema } from '@/lib/schemas/days-of-use.schema';

/**
 * Reactive count of distinct UTC days recorded in `audiblytics.daysOfUse` (NFR12 / AR13).
 */
export function useDistinctDayOfUse(): number {
  const [days] = useLocalStorage('audiblytics.daysOfUse', daysOfUseSchema.parse([]), daysOfUseSchema);
  return new Set(days).size;
}
