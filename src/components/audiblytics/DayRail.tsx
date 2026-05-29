'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

import { OfflineBadge } from '@/components/audiblytics/OfflineBadge';
import type { DayRailCellModel, DayRailCellState } from '@/features/calendar/use-day-rail-cells';
import { useDayRailCells } from '@/features/calendar/use-day-rail-cells';
import { cn } from '@/lib/utils';

type DayCellProps = {
  day: number;
  state: DayRailCellState;
  utcDate: string;
  onCompletedActivate?: () => void;
};

function DayCell({ day, state, utcDate, onCompletedActivate }: DayCellProps) {
  const screenReaderText: Record<DayRailCellState, string> = {
    future: `Day ${day}, upcoming`,
    completed: `Day ${day}, completed`,
    'completed-offline': `Day ${day}, completed via offline pack`,
    missed: `Day ${day}, missed`,
    today: `Day ${day}, today`,
  };

  const dotClass = {
    future: 'bg-ink-faint/60',
    completed: 'bg-primary',
    'completed-offline': 'bg-primary',
    missed: 'border border-divider bg-transparent',
    today: 'bg-primary ring-2 ring-primary-soft',
  }[state];

  const interactiveCompleted =
    (state === 'completed' || state === 'completed-offline') && onCompletedActivate;

  const rowClass = cn(
    'flex min-h-11 min-w-[44px] shrink-0 items-center gap-2 px-2 py-1',
    'lg:min-w-0 lg:flex-row lg:justify-between lg:py-1.5',
    interactiveCompleted &&
      'cursor-pointer rounded-sm transition-colors hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2',
  );

  const label = (
    <>
      <span
        className={cn(
          'text-rail',
          state === 'future' || state === 'missed' ? 'text-ink-faint' : 'text-foreground',
        )}
      >
        Day {day}
      </span>
      <span className="relative inline-flex shrink-0">
        <span className={cn('h-1.5 w-1.5 rounded-sm', dotClass)} aria-hidden="true" />
        {state === 'completed-offline' ? (
          <OfflineBadge className="absolute -right-1 -top-1" />
        ) : null}
      </span>
      <span className="sr-only">{screenReaderText[state]}</span>
    </>
  );

  if (interactiveCompleted) {
    return (
      <button
        type="button"
        className={rowClass}
        onClick={onCompletedActivate}
        aria-label={`Day ${day}, completed. Open calendar for ${utcDate}.`}
      >
        {label}
      </button>
    );
  }

  return (
    <div className={rowClass} role="presentation">
      {label}
    </div>
  );
}

export function DayRail() {
  const router = useRouter();
  const cells = useDayRailCells();

  const handleCompleted = useCallback(
    (utcDate: string) => {
      router.push(`/calendar?day=${encodeURIComponent(utcDate)}`, { scroll: false });
    },
    [router],
  );

  if (cells === undefined) {
    return (
      <nav
        aria-label="30-day progress"
        className={cn(
          'flex flex-row gap-1 overflow-x-auto border-b border-divider bg-surface px-4 py-2',
          'lg:sticky lg:top-0 lg:h-screen lg:w-20 lg:flex-col lg:gap-0 lg:overflow-x-visible lg:overflow-y-auto',
          'lg:border-r lg:border-b-0 lg:px-2 lg:py-4',
        )}
      >
        {Array.from({ length: 30 }, (_, i) => (
          <div
            key={i}
            className="min-h-11 min-w-[44px] shrink-0 rounded-sm bg-cream-dim lg:min-w-0"
            aria-hidden
          />
        ))}
      </nav>
    );
  }

  return (
    <nav
      aria-label="30-day progress"
      className={cn(
        'flex flex-row gap-1 overflow-x-auto border-b border-divider bg-surface px-4 py-2',
        'lg:sticky lg:top-0 lg:h-screen lg:w-20 lg:flex-col lg:gap-0 lg:overflow-x-visible lg:overflow-y-auto',
        'lg:border-r lg:border-b-0 lg:px-2 lg:py-4',
      )}
    >
      {cells.map((cell: DayRailCellModel) => (
        <DayCell
          key={cell.utcDate}
          day={cell.railDay}
          state={cell.state}
          utcDate={cell.utcDate}
          onCompletedActivate={
            cell.state === 'completed' || cell.state === 'completed-offline'
              ? () => handleCompleted(cell.utcDate)
              : undefined
          }
        />
      ))}
    </nav>
  );
}
