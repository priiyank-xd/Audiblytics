'use client';

import { useMemo } from 'react';

import { buildTrailingUtcDateWindow } from '@/features/calendar/build-trailing-utc-date-window';
import { evaluateCompletion } from '@/features/calendar/evaluate-completion';
import { useStatStreakSurface } from '@/features/calendar/stat-streak-surface-context';
import { useParagraphCacheUtcDateSet } from '@/features/calendar/use-paragraph-cache-utc-date-set';
import { useCompletions } from '@/features/calendar/use-completions';
import { formatUtcDate } from '@/lib/day-counter/format-utc-date';

export type CalendarGridCell = {
  utcDate: string;
  complete: boolean;
  usedOfflinePack: boolean;
};

export type UseCalendarGridOptions = {
  /**
   * When false, the UTC "today" cell does not use the ephemeral in-session paragraph flag
   * from {@link useStatStreakSurface} (persisted paragraph cache + completions only).
   */
  includeEphemeralParagraphOnToday?: boolean;
};

/**
 * FR55: trailing UTC window with per-cell completion from {@link evaluateCompletion} only (Story 4.2).
 */
export function useCalendarGrid(
  windowDays: number,
  options?: UseCalendarGridOptions,
): CalendarGridCell[] {
  const includeEphemeralParagraphOnToday = options?.includeEphemeralParagraphOnToday ?? true;
  const completions = useCompletions() ?? {};
  const paragraphDates = useParagraphCacheUtcDateSet();
  const { hasParagraphForTodayOnScreen } = useStatStreakSurface();

  return useMemo(() => {
    if (paragraphDates === undefined) {
      return [];
    }

    const anchor = new Date();
    const todayUtc = formatUtcDate(anchor);
    const utcDates = buildTrailingUtcDateWindow(anchor, windowDays);

    return utcDates.map((utcDate) => {
      const hasParagraphForDate =
        paragraphDates.has(utcDate) ||
        completions[utcDate]?.usedOfflinePack === true ||
        (utcDate === todayUtc &&
          includeEphemeralParagraphOnToday &&
          hasParagraphForTodayOnScreen);

      const complete = evaluateCompletion({
        utcDate,
        completions,
        hasParagraphForDate,
      });

      const usedOfflinePack =
        complete && completions[utcDate]?.usedOfflinePack === true;

      return { utcDate, complete, usedOfflinePack };
    });
  }, [
    completions,
    paragraphDates,
    hasParagraphForTodayOnScreen,
    includeEphemeralParagraphOnToday,
    windowDays,
  ]);
}
