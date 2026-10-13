'use client';

import Link from 'next/link';

import { ArchivedDayPanel } from '@/components/audiblytics/ArchivedDayPanel';
import { useArchivedDay } from '@/features/calendar/use-archived-day';
import { cn } from '@/lib/utils';

export type JourneyDayDetailPanelProps = {
  utcDate: string | null;
  isComplete: boolean | undefined;
  className?: string;
};

export function JourneyDayDetailPanel({
  utcDate,
  isComplete,
  className,
}: JourneyDayDetailPanelProps) {
  const archivedData = useArchivedDay(
    utcDate !== null && isComplete === true ? utcDate : null,
  );

  if (!utcDate) {
    return (
      <div
        className={cn(
          'rounded-lg border border-divider bg-surface-card p-6 text-body text-secondary',
          className,
        )}
      >
        Select a completed day to see session details.
      </div>
    );
  }

  if (isComplete === undefined) {
    return (
      <div
        className={cn(
          'rounded-lg border border-divider bg-surface-card p-6',
          className,
        )}
        aria-busy="true"
      >
        <div className="h-4 max-w-xs rounded-sm bg-cream-dim" />
        <div className="mt-4 h-24 rounded-sm bg-cream-dim" />
      </div>
    );
  }

  if (isComplete === false) {
    return (
      <div className={cn('rounded-lg border border-divider bg-surface-card p-6', className)}>
        <p className="text-body italic text-secondary font-serif">No session on this day.</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'space-y-6 rounded-lg border border-divider bg-surface-card p-6 xl:sticky xl:top-8',
        className,
      )}
    >
      {archivedData === undefined ? (
        <div aria-busy="true">
          <div className="h-4 max-w-xs rounded-sm bg-cream-dim" />
          <div className="mt-4 h-24 rounded-sm bg-cream-dim" />
        </div>
      ) : (
        <ArchivedDayPanel utcDate={utcDate} data={archivedData} />
      )}

      <p>
        <Link
          href={`/calendar?day=${encodeURIComponent(utcDate)}`}
          className="text-ui-sm text-primary underline underline-offset-4 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
        >
          View full archive
        </Link>
      </p>
    </div>
  );
}
