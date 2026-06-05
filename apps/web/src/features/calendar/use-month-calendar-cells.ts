'use client';

import { useMemo } from 'react';

import { buildUtcMonthGrid } from '@/features/calendar/build-utc-month-grid';
import { evaluateCompletion } from '@/features/calendar/evaluate-completion';
import type { CalendarGridCell } from '@/features/calendar/use-calendar-grid';
import { useStatStreakSurface } from '@/features/calendar/stat-streak-surface-context';
import { useParagraphCacheUtcDateSet } from '@/features/calendar/use-paragraph-cache-utc-date-set';
import { useCompletions } from '@/features/calendar/use-completions';
import { formatUtcDate } from '@/lib/day-counter/format-utc-date';

export type MonthCalendarSlot =
  | { kind: 'pad' }
  | ({ kind: 'day' } & CalendarGridCell);

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

/**
 * Current UTC month as a Monday-first grid with completion from the same sources as
 * {@link useCalendarGrid} (Story 4.2 / FR55).
 */
export function useMonthCalendarCells(anchorMonth: Date = new Date()): {
  monthLabel: string;
  weekdayLabels: readonly string[];
  slots: MonthCalendarSlot[];
  isReady: boolean;
} {
  const { monthLabel, items } = useMemo(
    () => buildUtcMonthGrid(anchorMonth),
    [anchorMonth],
  );

  const completions = useCompletions() ?? {};
  const paragraphDates = useParagraphCacheUtcDateSet();
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
