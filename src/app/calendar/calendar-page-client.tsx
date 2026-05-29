'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { ArchivedDayPanel } from '@/components/audiblytics/ArchivedDayPanel';
import { CalendarDayCell } from '@/components/audiblytics/CalendarDayCell';
import { FeatureRouteShell } from '@/components/audiblytics/FeatureRouteShell';
import {
  CALENDAR_WINDOW_DAYS,
  type CalendarWindowDays,
} from '@/features/calendar/build-trailing-utc-date-window';
import { useArchivedDay } from '@/features/calendar/use-archived-day';
import { useCalendarGrid } from '@/features/calendar/use-calendar-grid';
import { useIsUtcDayComplete } from '@/features/calendar/use-is-utc-day-complete';
import { utcDateSchema } from '@/lib/schemas/days-of-use.schema';
import { cn } from '@/lib/utils';

export function CalendarPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dayRaw = searchParams.get('day');

  const selectedDay = useMemo(() => {
    if (dayRaw === null || dayRaw.trim() === '') return null;
    const parsed = utcDateSchema.safeParse(dayRaw);
    return parsed.success ? parsed.data : null;
  }, [dayRaw]);

  const [windowDays, setWindowDays] = useState<CalendarWindowDays>(30);
  const cells = useCalendarGrid(windowDays);
  const isSelectionComplete = useIsUtcDayComplete(selectedDay);
  const archivedData = useArchivedDay(
    selectedDay !== null && isSelectionComplete === true ? selectedDay : null,
  );

  const handleWindow = useCallback((next: CalendarWindowDays) => {
    setWindowDays(next);
  }, []);

  const openDay = useCallback(
    (utcDate: string) => {
      router.push(`/calendar?day=${encodeURIComponent(utcDate)}`, { scroll: false });
    },
    [router],
  );

  return (
    <FeatureRouteShell className="min-w-0">
      <header className="border-divider border-b pb-4">
        <h1 className="text-headline-2 text-primary">Calendar</h1>
        <p className="mt-1 text-caption text-secondary">
          Your 30-day reading journey · trailing UTC days · completion from your log only
        </p>
      </header>

      <div
        className="mt-6 flex flex-wrap gap-2"
        role="toolbar"
        aria-label="Day range"
      >
        {CALENDAR_WINDOW_DAYS.map((d) => {
          const selected = d === windowDays;
          return (
            <button
              key={d}
              type="button"
              onClick={() => handleWindow(d)}
              aria-pressed={selected}
              className={cn(
                'rounded-sm border px-3 py-1.5 text-caption transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2',
                selected
                  ? 'border-primary bg-primary-soft text-primary'
                  : 'border-divider bg-surface text-secondary hover:text-foreground',
              )}
            >
              {d} days
            </button>
          );
        })}
      </div>

      <ul
        role="list"
        aria-label={`Last ${windowDays} days`}
        className={cn(
          'mt-6 grid min-w-0 gap-2',
          'grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10',
        )}
      >
        {cells.map((cell) => (
          <li key={cell.utcDate} className="min-w-0">
            <CalendarDayCell
              utcDate={cell.utcDate}
              complete={cell.complete}
              usedOfflinePack={cell.usedOfflinePack}
              onSelectComplete={cell.complete ? () => openDay(cell.utcDate) : undefined}
            />
          </li>
        ))}
      </ul>

      {selectedDay !== null ? (
        <div className="mt-10 min-w-0">
          {isSelectionComplete === undefined ? (
            <div className="rounded-sm border border-divider bg-surface-elevated p-6" aria-busy="true">
              <div className="h-4 max-w-xs rounded-sm bg-cream-dim" />
            </div>
          ) : isSelectionComplete === false ? (
            <p className="text-body italic text-secondary font-serif">No session on this day.</p>
          ) : archivedData === undefined ? (
            <div className="rounded-sm border border-divider bg-surface-elevated p-6" aria-busy="true">
              <div className="h-4 max-w-xs rounded-sm bg-cream-dim" />
            </div>
          ) : (
            <ArchivedDayPanel utcDate={selectedDay} data={archivedData} />
          )}
        </div>
      ) : null}
    </FeatureRouteShell>
  );
}
