'use client';

import { useMemo } from 'react';

import { evaluateCompletion } from '@/features/calendar/evaluate-completion';
import { useParagraphCacheUtcDateSet } from '@/features/calendar/use-paragraph-cache-utc-date-set';
import { useStatStreakSurface } from '@/features/calendar/stat-streak-surface-context';
import { useCompletions } from '@/features/calendar/use-completions';
import { formatUtcDate } from '@/lib/day-counter/format-utc-date';

export function useIsUtcDayComplete(utcDate: string | null): boolean | undefined {
  const completions = useCompletions() ?? {};
  const paragraphDates = useParagraphCacheUtcDateSet();
  const { hasParagraphForTodayOnScreen } = useStatStreakSurface();

  return useMemo(() => {
    if (!utcDate) return undefined;
    if (paragraphDates === undefined) return undefined;

    const todayUtc = formatUtcDate(new Date());
    const hasParagraphForDate =
      paragraphDates.has(utcDate) ||
      completions[utcDate]?.usedOfflinePack === true ||
      (utcDate === todayUtc && hasParagraphForTodayOnScreen);

    return evaluateCompletion({
      utcDate,
      completions,
      hasParagraphForDate,
    });
  }, [utcDate, completions, paragraphDates, hasParagraphForTodayOnScreen]);
}
