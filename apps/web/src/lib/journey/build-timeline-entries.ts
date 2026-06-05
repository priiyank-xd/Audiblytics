import type { CalendarGridCell } from '@/features/calendar/use-calendar-grid';

export type TimelineEntry = CalendarGridCell & {
  dateLabel: string;
};

function formatTimelineDateLabel(utcYmd: string): string {
  const [y, mo, d] = utcYmd.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(y, mo - 1, d)));
}

/** Completed cells only, newest first. */
export function buildTimelineEntries(cells: CalendarGridCell[]): TimelineEntry[] {
  return cells
    .filter((cell) => cell.complete)
    .sort((a, b) => (a.utcDate < b.utcDate ? 1 : a.utcDate > b.utcDate ? -1 : 0))
    .map((cell) => ({
      ...cell,
      dateLabel: formatTimelineDateLabel(cell.utcDate),
    }));
}
