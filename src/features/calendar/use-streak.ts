'use client';

import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';

import { isUtcDayCompleteFromInputs } from '@/features/calendar/is-utc-day-complete';
import { loadParagraphCacheUtcDateSet } from '@/features/calendar/load-paragraph-cache-utc-date-set';
import { useStatStreakSurface } from '@/features/calendar/stat-streak-surface-context';
import { currentStreak } from '@/lib/day-counter/index';
import { formatUtcDate } from '@/lib/day-counter/format-utc-date';
import { LIVE_QUERY_EMPTY_DEPS } from '@/lib/hooks/live-query-empty-deps';
import { completionsSchema } from '@/lib/schemas/completions.schema';
import { useLocalStorage } from '@/lib/storage/use-local-storage';

/**
 * Reactive FR57 streak: completion predicate matches Story 4.2; invalidates on completions,
 * paragraph cache, offline-pack flags, and same-session Today paragraph visibility.
 */
export function useStreak(): number {
  const [completions] = useLocalStorage(
    'audiblytics.completions',
    completionsSchema.parse({}),
    completionsSchema,
  );
  const paragraphDates = useLiveQuery(() => loadParagraphCacheUtcDateSet(), LIVE_QUERY_EMPTY_DEPS);
  const { hasParagraphForTodayOnScreen } = useStatStreakSurface();

  return useMemo(() => {
    if (paragraphDates === undefined) {
      return 0;
    }

    const anchor = new Date();
    const todayUtc = formatUtcDate(anchor);

    const isUtcDayComplete = (utcDate: string): boolean => {
      const hasParagraphForDate =
        paragraphDates.has(utcDate) ||
        completions[utcDate]?.usedOfflinePack === true ||
        (utcDate === todayUtc && hasParagraphForTodayOnScreen);

      return isUtcDayCompleteFromInputs({
        utcDate,
        completions,
        hasParagraphForDate,
      });
    };

    return currentStreak(anchor, isUtcDayComplete);
  }, [completions, paragraphDates, hasParagraphForTodayOnScreen]);
}
