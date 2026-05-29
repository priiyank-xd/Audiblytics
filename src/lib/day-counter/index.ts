import { addUtcCalendarDays } from '@/lib/day-counter/add-utc-calendar-days';
import { formatUtcDate } from '@/lib/day-counter/format-utc-date';
import { readDaysOfUse, writeDaysOfUse } from '@/lib/storage/use-local-storage';

/** Append today’s UTC date to `audiblytics.daysOfUse` if not already present (idempotent per UTC day). */
export function recordDayOfUse(now: Date = new Date()): void {
  if (typeof window === 'undefined') return;

  const utcDate = formatUtcDate(now);
  const existing = readDaysOfUse();
  if (existing.includes(utcDate)) return;

  writeDaysOfUse([...existing, utcDate]);
}

/** Count of distinct UTC dates in `audiblytics.daysOfUse`. */
export function distinctDaysOfUse(): number {
  return new Set(readDaysOfUse()).size;
}

/**
 * Day index stamped on a recording at save time (before `recordDayOfUse`).
 * Aligns with Today header `Math.max(1, distinctDaysOfUse())` when today is not yet recorded.
 */
export function dayOfUseAtRecordingSave(now: Date = new Date()): number {
  const todayUtc = formatUtcDate(now);
  const distinct = distinctDaysOfUse();
  if (readDaysOfUse().includes(todayUtc)) {
    return Math.max(1, distinct);
  }
  return Math.max(1, distinct + 1);
}

/**
 * FR57: consecutive completed UTC calendar days ending at `formatUtcDate(anchor)`, where “complete”
 * is defined by `isUtcDayComplete` (same rules as `evaluateCompletion` in Story 4.2, wired from
 * `features/calendar/is-utc-day-complete.ts`). Any gap resets the count. O(streak length) predicate
 * calls.
 */
export function currentStreak(anchor: Date, isUtcDayComplete: (utcDate: string) => boolean): number {
  const today = formatUtcDate(anchor);
  if (!isUtcDayComplete(today)) return 0;

  let count = 1;
  let cursor = addUtcCalendarDays(today, -1);
  while (isUtcDayComplete(cursor)) {
    count += 1;
    cursor = addUtcCalendarDays(cursor, -1);
  }
  return count;
}

export { addUtcCalendarDays } from '@/lib/day-counter/add-utc-calendar-days';
