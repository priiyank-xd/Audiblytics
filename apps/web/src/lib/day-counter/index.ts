import { addUtcCalendarDays } from '@/lib/day-counter/add-utc-calendar-days';
import { notifyDaysOfUseMutated } from '@/lib/day-counter/days-of-use-mutated';
import {
  appendServerDaysOfUseCache,
  getCachedServerDaysOfUse,
} from '@/lib/day-counter/days-of-use-server-cache';
import { distinctDaysFromMerged } from '@/lib/day-counter/merge-days-of-use';
import { formatUtcDate } from '@/lib/day-counter/format-utc-date';
import { stampDayOfUse as stampDayOfUseApi } from '@/lib/api/days-of-use';
import { isApiStorageBackend } from '@/lib/config/storage-backend';
import { readDaysOfUse, writeDaysOfUse } from '@/lib/storage/use-local-storage';

/** Append today’s UTC date to `audiblytics.daysOfUse` if not already present (idempotent per UTC day). */
export function recordDayOfUse(now: Date = new Date()): void {
  if (typeof window === 'undefined') return;

  const utcDate = formatUtcDate(now);
  const existing = readDaysOfUse();
  if (!existing.includes(utcDate)) {
    writeDaysOfUse([...existing, utcDate]);
  }

  if (!isApiStorageBackend()) return;

  void stampDayOfUseApi(utcDate)
    .then((stamped) => {
      appendServerDaysOfUseCache(stamped);
      notifyDaysOfUseMutated();
    })
    .catch((e) => {
      console.warn('[day-counter] server day-of-use stamp failed', e);
    });
}

/** Count of distinct UTC dates (server ∪ local in API mode). */
export function distinctDaysOfUse(): number {
  const local = readDaysOfUse();
  if (!isApiStorageBackend()) {
    return new Set(local).size;
  }
  return distinctDaysFromMerged(local, getCachedServerDaysOfUse());
}

/**
 * Day index stamped on a recording at save time (before `recordDayOfUse`).
 * Aligns with Today header `Math.max(1, distinctDaysOfUse())` when today is not yet recorded.
 */
export function dayOfUseAtRecordingSave(now: Date = new Date()): number {
  const todayUtc = formatUtcDate(now);
  const distinct = distinctDaysOfUse();
  if (readDaysOfUse().includes(todayUtc) || getCachedServerDaysOfUse().includes(todayUtc)) {
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
export { longestStreakFromCompletedDates } from '@/lib/day-counter/longest-streak';
