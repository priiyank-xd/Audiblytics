'use client';

import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';

import { evaluateCompletion } from '@/features/calendar/evaluate-completion';
import { loadParagraphCacheUtcDateSet } from '@/features/calendar/load-paragraph-cache-utc-date-set';
import { useStatStreakSurface } from '@/features/calendar/stat-streak-surface-context';
import { formatUtcDate } from '@/lib/day-counter/format-utc-date';
import { LIVE_QUERY_EMPTY_DEPS } from '@/lib/hooks/live-query-empty-deps';
import { useCompletions } from '@/features/calendar/use-completions';

export function useIsUtcDayComplete(utcDate: string | null): boolean | undefined {
  const completions = useCompletions() ?? {};
  const paragraphDates = useLiveQuery(() => loadParagraphCacheUtcDateSet(), LIVE_QUERY_EMPTY_DEPS);
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
