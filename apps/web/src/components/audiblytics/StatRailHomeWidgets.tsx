'use client';

import type { ReactNode } from 'react';
import { Bookmark, CalendarDays, Flame, Mic } from 'lucide-react';

import { useCollection } from '@/features/collection/use-collection';
import { useJourneyStats } from '@/features/journey/use-journey-stats';
import { useRecordings } from '@/features/voice-journal/use-recordings';
import { useDistinctDayOfUse } from '@/lib/day-counter/use-distinct-day-of-use';
import { cn } from '@/lib/utils';

const JOURNEY_DAYS = 30;

function HomeConsistencyInlineBanner() {
  return (
    <div className="mt-6 rounded-lg border-l-[3px] border-primary bg-cream-shade-2 px-4 py-3.5">
      <p className="font-sans text-caption font-medium text-foreground">
        Consistency is the key to fluency.
      </p>
    </div>
  );
}

type OverviewRowProps = {
  icon: ReactNode;
  label: string;
  value: string;
};

function OverviewRow({ icon, label, value }: OverviewRowProps) {
  return (
    <div className="flex h-home-overview-row items-center justify-between gap-3">
      <span className="inline-flex min-w-0 items-center gap-3 font-sans text-ui-sm text-foreground">
        <span className="shrink-0 text-secondary">{icon}</span>
        <span className="truncate">{label}</span>
      </span>
      <span className="shrink-0 font-mono text-data text-foreground">{value}</span>
    </div>
  );
}

export function HomeOverviewCard({ compact = false }: { compact?: boolean }) {
  const entries = useCollection();
  const recordings = useRecordings();
  const distinctDays = useDistinctDayOfUse();
  const { longestStreak, isReady } = useJourneyStats();

  const wordCount = entries?.length;
  const recordingCount = recordings?.length;
  const dayOfJourney = Math.min(distinctDays, JOURNEY_DAYS);
  const journeyPct = Math.round((dayOfJourney / JOURNEY_DAYS) * 100);

  return (
    <section
      aria-label="Overview"
      className={cn(
        'flex min-h-0 flex-col overflow-hidden rounded-home-card border border-divider bg-surface-card p-home-rail-card',
        compact && 'h-full',
      )}
    >
      <h2 className="font-serif text-headline-3 text-foreground">Overview</h2>
      <div className="mt-7 flex flex-col gap-home-overview-row">
        <OverviewRow
          icon={<Mic className="size-4" strokeWidth={1.5} />}
          label="Recordings"
          value={recordingCount === undefined ? '—' : String(recordingCount)}
        />
        <OverviewRow
          icon={<Bookmark className="size-4" strokeWidth={1.5} />}
          label="Words in collection"
          value={wordCount === undefined ? '—' : String(wordCount)}
        />
        <OverviewRow
          icon={<CalendarDays className="size-4" strokeWidth={1.5} />}
          label="Day progress"
          value={`${dayOfJourney} / ${JOURNEY_DAYS} (${journeyPct}%)`}
        />
        <OverviewRow
          icon={<Flame className="size-4" strokeWidth={1.5} />}
          label="Longest streak"
          value={isReady ? String(longestStreak) : '—'}
        />
      </div>
      <HomeConsistencyInlineBanner />
    </section>
  );
}
