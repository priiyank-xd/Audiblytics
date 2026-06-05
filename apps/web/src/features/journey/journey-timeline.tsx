'use client';

import { Check } from 'lucide-react';
import { useMemo } from 'react';

import { OfflineBadge } from '@/components/audiblytics/OfflineBadge';
import { useCalendarGrid } from '@/features/calendar/use-calendar-grid';
import { buildTimelineEntries } from '@/lib/journey/build-timeline-entries';
import { cn } from '@/lib/utils';

const TIMELINE_WINDOW_DAYS = 90;

export type JourneyTimelineProps = {
  selectedUtcDate: string | null;
  onSelectUtcDate: (utcDate: string) => void;
};

export function JourneyTimeline({ selectedUtcDate, onSelectUtcDate }: JourneyTimelineProps) {
  const cells = useCalendarGrid(TIMELINE_WINDOW_DAYS);
  const entries = useMemo(() => buildTimelineEntries(cells), [cells]);
  const isReady = cells.length === TIMELINE_WINDOW_DAYS;

  if (!isReady) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Loading timeline">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-14 rounded-lg bg-cream-dim" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <p className="text-body italic text-secondary font-serif">
        No completed sessions in the last {TIMELINE_WINDOW_DAYS} days.
      </p>
    );
  }

  return (
    <ul role="list" aria-label="Completed sessions" className="space-y-2">
      {entries.map((entry) => {
        const selected = selectedUtcDate === entry.utcDate;
        return (
          <li key={entry.utcDate}>
            <button
              type="button"
              onClick={() => onSelectUtcDate(entry.utcDate)}
              aria-current={selected ? 'true' : undefined}
              className={cn(
                'flex w-full min-w-0 items-center gap-4 rounded-lg border px-4 py-3 text-left transition-colors',
                'hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2',
                selected
                  ? 'border-primary bg-primary-soft'
                  : 'border-divider bg-surface-card',
              )}
            >
              <span className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                <Check className="size-4" strokeWidth={2} aria-hidden />
                {entry.usedOfflinePack ? (
                  <OfflineBadge className="absolute -right-0.5 -top-0.5" />
                ) : null}
              </span>
              <span className="min-w-0">
                <span className="block text-ui-sm font-medium text-foreground">
                  {entry.dateLabel}
                </span>
                <span className="block text-caption text-secondary">
                  {entry.usedOfflinePack ? 'Completed via offline pack' : 'Session completed'}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
