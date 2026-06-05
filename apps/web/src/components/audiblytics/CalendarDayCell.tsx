'use client';

import { useMemo } from 'react';

import { OfflineBadge } from '@/components/audiblytics/OfflineBadge';
import { cn } from '@/lib/utils';

export type CalendarDayCellProps = {
  utcDate: string;
  complete: boolean;
  usedOfflinePack?: boolean;
  /** When set with `complete`, cell is a button that navigates to archived day. */
  onSelectComplete?: () => void;
  /** Month grid on Home omits the month prefix (shows day of month only). */
  labelStyle?: 'month-day' | 'day-only';
  isSelected?: boolean;
};

function utcYmdToDisplayParts(
  utcYmd: string,
  labelStyle: 'month-day' | 'day-only',
): { primaryLabel: string; ariaDate: string } {
  const [y, mo, d] = utcYmd.split('-').map(Number);
  const t = Date.UTC(y, mo - 1, d);
  const ariaDate = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(t));

  if (labelStyle === 'day-only') {
    return { primaryLabel: String(d), ariaDate };
  }

  const monthDay = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(t));
  return { primaryLabel: monthDay, ariaDate };
}

export function CalendarDayCell({
  utcDate,
  complete,
  usedOfflinePack = false,
  onSelectComplete,
  labelStyle = 'month-day',
  isSelected = false,
}: CalendarDayCellProps) {
  const { primaryLabel, ariaDate } = useMemo(
    () => utcYmdToDisplayParts(utcDate, labelStyle),
    [utcDate, labelStyle],
  );
  const statusLabel = complete
    ? usedOfflinePack
      ? 'completed via offline pack'
      : 'completed'
    : 'missed';

  const inner = (
    <>
      <span
        className={cn(
          'max-w-full truncate text-center text-caption tabular-nums',
          complete ? 'text-foreground' : 'text-tertiary',
        )}
      >
        {primaryLabel}
      </span>
      <span className="relative inline-flex shrink-0">
        <span
          className={cn(
            'h-2 w-2 rounded-sm',
            complete ? 'bg-primary' : 'border border-divider bg-transparent',
          )}
          aria-hidden
        />
        {complete && usedOfflinePack ? (
          <OfflineBadge className="absolute -right-1.5 -top-1.5" />
        ) : null}
      </span>
    </>
  );

  if (complete && onSelectComplete) {
    return (
      <button
        type="button"
        onClick={onSelectComplete}
        aria-label={`${ariaDate}, completed. Open archived day.`}
        className={cn(
          'flex min-h-10 min-w-0 w-full flex-col items-center justify-center gap-1 rounded-sm border px-0.5 py-1',
          'transition-colors hover:bg-surface-elevated',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2',
          isSelected ? 'border-primary bg-primary-soft' : 'border-transparent',
        )}
      >
        {inner}
      </button>
    );
  }

  return (
    <div
      aria-label={`${ariaDate}, ${statusLabel}`}
      className={cn(
        'flex min-h-10 min-w-0 flex-col items-center justify-center gap-1 rounded-sm border border-transparent px-0.5 py-1',
      )}
    >
      {inner}
    </div>
  );
}
