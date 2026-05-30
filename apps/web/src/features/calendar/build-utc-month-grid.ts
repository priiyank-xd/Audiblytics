import { formatUtcDate } from '@/lib/day-counter/format-utc-date';

export type UtcMonthGridItem =
  | { type: 'pad' }
  | { type: 'day'; utcDate: string };

/**
 * UTC month laid out as Monday-first rows for a classic calendar grid (NFR13).
 */
export function buildUtcMonthGrid(anchor: Date): {
  monthLabel: string;
  items: UtcMonthGridItem[];
} {
  const y = anchor.getUTCFullYear();
  const mo = anchor.getUTCMonth();
  const first = new Date(Date.UTC(y, mo, 1));
  const lastDay = new Date(Date.UTC(y, mo + 1, 0)).getUTCDate();
  const dow = first.getUTCDay();
  const leading = (dow + 6) % 7;

  const items: UtcMonthGridItem[] = [];
  for (let i = 0; i < leading; i += 1) items.push({ type: 'pad' });
  for (let d = 1; d <= lastDay; d += 1) {
    items.push({
      type: 'day',
      utcDate: formatUtcDate(new Date(Date.UTC(y, mo, d))),
    });
  }

  const monthLabel = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(first);

  return { monthLabel, items };
}
