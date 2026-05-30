import { formatUtcDate } from '@/lib/day-counter/format-utc-date';

/** Step a UTC `YYYY-MM-DD` by whole calendar days using UTC midnight math (NFR13). */
export function addUtcCalendarDays(utcYmd: string, deltaDays: number): string {
  const [y, m, d] = utcYmd.split('-').map(Number);
  const t = Date.UTC(y, m - 1, d) + deltaDays * 86_400_000;
  return formatUtcDate(new Date(t));
}
