'use client';

import { useMemo } from 'react';

import { isUtcDayCompleteFromInputs } from '@/features/calendar/is-utc-day-complete';
import { useParagraphCacheUtcDateSet } from '@/features/calendar/use-paragraph-cache-utc-date-set';
import { useStatStreakSurface } from '@/features/calendar/stat-streak-surface-context';
import { useCompletions } from '@/features/calendar/use-completions';
import { currentStreak } from '@/lib/day-counter/index';
import { formatUtcDate } from '@/lib/day-counter/format-utc-date';

/**
 * Reactive FR57 streak: completion predicate matches Story 4.2; invalidates on completions,
 * paragraph cache, offline-pack flags, and same-session Today paragraph visibility.
 */
export function useStreak(): number {
  const completions = useCompletions() ?? {};
  const paragraphDates = useParagraphCacheUtcDateSet();
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
