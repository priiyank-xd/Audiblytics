'use client';

import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';

import { buildUtcMonthGrid } from '@/features/calendar/build-utc-month-grid';
import { evaluateCompletion } from '@/features/calendar/evaluate-completion';
import type { CalendarGridCell } from '@/features/calendar/use-calendar-grid';
import { useStatStreakSurface } from '@/features/calendar/stat-streak-surface-context';
import { loadParagraphCacheUtcDateSet } from '@/features/calendar/load-paragraph-cache-utc-date-set';
import { formatUtcDate } from '@/lib/day-counter/format-utc-date';
import { LIVE_QUERY_EMPTY_DEPS } from '@/lib/hooks/live-query-empty-deps';
import { useCompletions } from '@/features/calendar/use-completions';

export type MonthCalendarSlot =
  | { kind: 'pad' }
  | ({ kind: 'day' } & CalendarGridCell);

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

/**
 * Current UTC month as a Monday-first grid with completion from the same sources as
 * {@link useCalendarGrid} (Story 4.2 / FR55).
 */
export function useMonthCalendarCells(): {
  monthLabel: string;
  weekdayLabels: readonly string[];
  slots: MonthCalendarSlot[];
  isReady: boolean;
} {
  const anchor = useMemo(() => new Date(), []);
  const { monthLabel, items } = useMemo(() => buildUtcMonthGrid(anchor), [anchor]);

  const completions = useCompletions() ?? {};
  const paragraphDates = useLiveQuery(
    () => loadParagraphCacheUtcDateSet(),
    LIVE_QUERY_EMPTY_DEPS,
  );
  const { hasParagraphForTodayOnScreen } = useStatStreakSurface();

  const slots = useMemo((): MonthCalendarSlot[] => {
    if (paragraphDates === undefined) {
      return [];
    }

    const todayUtc = formatUtcDate(new Date());

    return items.map((item): MonthCalendarSlot => {
      if (item.type === 'pad') return { kind: 'pad' };

      const utcDate = item.utcDate;
      const hasParagraphForDate =
        paragraphDates.has(utcDate) ||
        completions[utcDate]?.usedOfflinePack === true ||
        (utcDate === todayUtc && hasParagraphForTodayOnScreen);

      const complete = evaluateCompletion({
        utcDate,
        completions,
        hasParagraphForDate,
      });
      const usedOfflinePack = complete && completions[utcDate]?.usedOfflinePack === true;

      return { kind: 'day', utcDate, complete, usedOfflinePack };
    });
  }, [completions, hasParagraphForTodayOnScreen, items, paragraphDates]);

  return {
    monthLabel,
    weekdayLabels: WEEKDAY_LABELS,
    slots,
    isReady: paragraphDates !== undefined,
  };
}
