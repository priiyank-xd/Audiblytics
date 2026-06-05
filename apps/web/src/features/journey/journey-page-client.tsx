'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { FeatureRouteShell } from '@/components/audiblytics/FeatureRouteShell';
import { JourneyCalendar } from '@/features/journey/journey-calendar';
import { JourneyDayDetailPanel } from '@/features/journey/journey-day-detail-panel';
import { JourneyStatsRow } from '@/features/journey/journey-stats-row';
import { JourneyTimeline } from '@/features/journey/journey-timeline';
import { useIsUtcDayComplete } from '@/features/calendar/use-is-utc-day-complete';
import { useMonthCalendarCells } from '@/features/calendar/use-month-calendar-cells';
import { Button } from '@/components/ui/button';
import { utcDateSchema } from '@/lib/schemas/days-of-use.schema';
import { cn } from '@/lib/utils';

type JourneyView = 'calendar' | 'timeline';

function utcDateToAnchorMonth(utcDate: string): Date {
  const [y, m] = utcDate.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1));
}

function parseView(raw: string | null): JourneyView {
  if (raw === 'timeline') return 'timeline';
  return 'calendar';
}

export function JourneyPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = parseView(searchParams.get('view'));
  const dayRaw = searchParams.get('day');

  const selectedFromUrl = useMemo(() => {
    if (dayRaw === null || dayRaw.trim() === '') return null;
    const parsed = utcDateSchema.safeParse(dayRaw);
    return parsed.success ? parsed.data : null;
  }, [dayRaw]);

  const [selectedUtcDate, setSelectedUtcDate] = useState<string | null>(selectedFromUrl);
  const autoSelectedRef = useRef(false);
  const [anchorMonth, setAnchorMonth] = useState(() => new Date());
  const {
    monthLabel,
    weekdayLabels,
    slots,
    isReady: monthReady,
  } = useMonthCalendarCells(anchorMonth);

  const isSelectionComplete = useIsUtcDayComplete(selectedUtcDate);

  useEffect(() => {
    setSelectedUtcDate(selectedFromUrl);
  }, [selectedFromUrl]);

  useEffect(() => {
    if (!monthReady || autoSelectedRef.current || selectedFromUrl !== null) return;

    const completedInMonth = slots
      .filter((s): s is Extract<typeof s, { kind: 'day' }> => s.kind === 'day' && s.complete)
      .map((s) => s.utcDate)
      .sort()
      .reverse();

    if (completedInMonth.length === 0) return;

    autoSelectedRef.current = true;
    const next = completedInMonth[0]!;
    setSelectedUtcDate(next);
    const params = new URLSearchParams(searchParams.toString());
    params.set('day', next);
    router.replace(`/journey?${params.toString()}`, { scroll: false });
  }, [monthReady, router, searchParams, selectedFromUrl, slots]);

  const setView = useCallback(
    (next: JourneyView) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('view', next);
      router.replace(`/journey?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const selectDay = useCallback(
    (utcDate: string) => {
      setSelectedUtcDate(utcDate);
      setAnchorMonth(utcDateToAnchorMonth(utcDate));
      const params = new URLSearchParams(searchParams.toString());
      params.set('day', utcDate);
      router.replace(`/journey?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  return (
    <FeatureRouteShell>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <header className="space-y-1">
          <h1 className="text-headline-2 text-primary">Journey</h1>
          <p className="text-body text-primary">
            Your practice over time — completion from your log only.
          </p>
        </header>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <Button type="button" variant="outline" disabled aria-disabled>
            Export journey
          </Button>
          <p className="text-caption text-secondary">Not available in this build.</p>
        </div>
      </div>

      <div className="mt-8">
        <JourneyStatsRow />
      </div>

      <div
        className="mt-8 flex flex-wrap gap-2"
        role="toolbar"
        aria-label="Journey view"
      >
        {(['calendar', 'timeline'] as const).map((id) => {
          const active = view === id;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={active}
              onClick={() => setView(id)}
              className={cn(
                'rounded-sm border px-4 py-2 text-ui-sm capitalize transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2',
                active
                  ? 'border-primary bg-primary-soft text-primary'
                  : 'border-divider bg-surface text-secondary hover:text-foreground',
              )}
            >
              {id}
            </button>
          );
        })}
      </div>

      <div className="mt-8 grid min-w-0 gap-8 xl:grid-cols-2 xl:gap-10">
        <div className="min-w-0">
          {view === 'calendar' ? (
            <JourneyCalendar
              anchorMonth={anchorMonth}
              onAnchorMonthChange={setAnchorMonth}
              monthLabel={monthLabel}
              weekdayLabels={weekdayLabels}
              slots={slots}
              isReady={monthReady}
              selectedUtcDate={selectedUtcDate}
              onSelectUtcDate={selectDay}
            />
          ) : (
            <JourneyTimeline
              selectedUtcDate={selectedUtcDate}
              onSelectUtcDate={selectDay}
            />
          )}
        </div>
        <JourneyDayDetailPanel
          utcDate={selectedUtcDate}
          isComplete={isSelectionComplete}
        />
      </div>
    </FeatureRouteShell>
  );
}
