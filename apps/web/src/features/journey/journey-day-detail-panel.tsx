'use client';

import Link from 'next/link';

import { ArchivedDayPanel } from '@/components/audiblytics/ArchivedDayPanel';
import { useArchivedDay } from '@/features/calendar/use-archived-day';
import { useJourneyReflection } from '@/features/journey/use-journey-reflection';
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
  const { note, setNote } = useJourneyReflection(utcDate);

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

      <section aria-label="Reflection note" className="space-y-2 border-t border-divider pt-6">
        <h3 className="text-ui-sm font-medium text-foreground">Reflection</h3>
        <p className="text-caption text-secondary">Private notes for this day.</p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          placeholder="What did you notice about your practice?"
          className="mt-2 w-full resize-y rounded-lg border border-divider bg-surface px-3 py-3 text-ui-sm text-foreground placeholder:text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
        />
      </section>

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
