'use client';

import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';

import { buildTrailingUtcDateWindow } from '@/features/calendar/build-trailing-utc-date-window';
import { evaluateCompletion } from '@/features/calendar/evaluate-completion';
import { useStatStreakSurface } from '@/features/calendar/stat-streak-surface-context';
import { loadParagraphCacheUtcDateSet } from '@/features/calendar/load-paragraph-cache-utc-date-set';
import { formatUtcDate } from '@/lib/day-counter/format-utc-date';
import { LIVE_QUERY_EMPTY_DEPS } from '@/lib/hooks/live-query-empty-deps';
import { completionsSchema } from '@/lib/schemas/completions.schema';
import { useLocalStorage } from '@/lib/storage/use-local-storage';

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
  const [completions] = useLocalStorage(
    'audiblytics.completions',
    completionsSchema.parse({}),
    completionsSchema,
  );
  const paragraphDates = useLiveQuery(() => loadParagraphCacheUtcDateSet(), LIVE_QUERY_EMPTY_DEPS);
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
