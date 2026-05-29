import { addUtcCalendarDays } from '@/lib/day-counter/add-utc-calendar-days';
import { formatUtcDate } from '@/lib/day-counter/format-utc-date';

export const CALENDAR_WINDOW_DAYS = [30, 60, 90] as const;
export type CalendarWindowDays = (typeof CALENDAR_WINDOW_DAYS)[number];

/**
 * Ordered UTC `YYYY-MM-DD` strings from `(anchor − windowDays + 1)` through `anchor` inclusive
 * (exactly `windowDays` entries). NFR13: uses UTC calendar stepping only.
 */
export function buildTrailingUtcDateWindow(anchor: Date, windowDays: number): string[] {
  const end = formatUtcDate(anchor);
  const oldest = addUtcCalendarDays(end, -(windowDays - 1));
  const out: string[] = [];
  for (let i = 0; i < windowDays; i += 1) {
    out.push(addUtcCalendarDays(oldest, i));
  }
  return out;
}
