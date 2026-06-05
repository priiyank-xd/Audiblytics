'use client';

import { useMemo } from 'react';

import { buildTrailingUtcDateWindow } from '@/features/calendar/build-trailing-utc-date-window';
import { evaluateCompletion } from '@/features/calendar/evaluate-completion';
import { useParagraphCacheUtcDateSet } from '@/features/calendar/use-paragraph-cache-utc-date-set';
import { useStatStreakSurface } from '@/features/calendar/stat-streak-surface-context';
import { useCompletions } from '@/features/calendar/use-completions';
import { formatUtcDate } from '@/lib/day-counter/format-utc-date';

export type DayRailCellState = 'future' | 'completed' | 'completed-offline' | 'missed' | 'today';

export type DayRailCellModel = {
  railDay: number;
  utcDate: string;
  state: DayRailCellState;
};

export function useDayRailCells(): DayRailCellModel[] | undefined {
  const completions = useCompletions() ?? {};
  const paragraphDates = useParagraphCacheUtcDateSet();
  const { hasParagraphForTodayOnScreen } = useStatStreakSurface();

  return useMemo(() => {
    if (paragraphDates === undefined) return undefined;

    const anchor = new Date();
    const todayUtc = formatUtcDate(anchor);
    const dates = buildTrailingUtcDateWindow(anchor, 30);

    return dates.map((utcDate, idx) => {
      const railDay = idx + 1;
      const hasParagraphForDate =
        paragraphDates.has(utcDate) ||
        completions[utcDate]?.usedOfflinePack === true ||
        (utcDate === todayUtc && hasParagraphForTodayOnScreen);

      const complete = evaluateCompletion({
        utcDate,
        completions,
        hasParagraphForDate,
      });
      const usedOffline = completions[utcDate]?.usedOfflinePack === true;

      let state: DayRailCellState;
      if (utcDate === todayUtc) {
        state = 'today';
      } else if (complete && usedOffline) {
        state = 'completed-offline';
      } else if (complete) {
        state = 'completed';
      } else {
        state = 'missed';
      }

      return { railDay, utcDate, state };
    });
  }, [completions, paragraphDates, hasParagraphForTodayOnScreen]);
}
