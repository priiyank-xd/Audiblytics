import { addUtcCalendarDays } from '@/lib/day-counter/add-utc-calendar-days';

/**
 * Max run of consecutive UTC calendar days in a sorted ascending list of completed dates.
 */
export function longestStreakFromCompletedDates(completedDatesAscending: string[]): number {
  if (completedDatesAscending.length === 0) return 0;
  if (completedDatesAscending.length === 1) return 1;

  let maxRun = 1;
  let run = 1;

  for (let i = 1; i < completedDatesAscending.length; i += 1) {
    const prev = completedDatesAscending[i - 1]!;
    const curr = completedDatesAscending[i]!;
    if (addUtcCalendarDays(prev, 1) === curr) {
      run += 1;
      maxRun = Math.max(maxRun, run);
    } else {
      run = 1;
    }
  }

  return maxRun;
}
