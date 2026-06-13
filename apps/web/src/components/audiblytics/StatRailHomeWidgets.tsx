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
    <div className="mt-3.5 rounded-md border-l-2 border-home-overview-quote bg-home-overview-quote px-3.5 py-3 font-sans text-caption text-home-ink-muted">
      Consistency is the key to fluency.
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
    <div className="flex items-center py-2.5 font-sans text-ui-sm text-foreground">
      <span className="inline-flex min-w-0 flex-1 items-center gap-3 text-home-ink-nav">
        <span className="shrink-0 text-home-ink-muted">{icon}</span>
        <span className="truncate">{label}</span>
      </span>
      <span className="shrink-0 font-mono text-data text-foreground">{value}</span>
    </div>
  );
}

export function HomeOverviewCard({ flat = false }: { flat?: boolean }) {
  const entries = useCollection();
  const recordings = useRecordings();
  const distinctDays = useDistinctDayOfUse();
  const { longestStreak, isReady } = useJourneyStats();

  const wordCount = entries?.length;
  const recordingCount = recordings?.length;
  const dayOfJourney = Math.min(distinctDays, JOURNEY_DAYS);
  const journeyPct = Math.round((dayOfJourney / JOURNEY_DAYS) * 100);
  const longestLabel =
    longestStreak === 1 ? '1 day' : isReady ? `${longestStreak} days` : '—';

  return (
    <section
      aria-label="Overview"
      className={cn('px-1.5 py-1', flat ? 'min-h-0' : 'rounded-lg border border-divider bg-surface-card p-5')}
    >
      <h2 className="mb-4 font-serif text-headline-3 text-foreground">Overview</h2>
      <OverviewRow
        icon={<Mic className="size-4" strokeWidth={1.6} />}
        label="Recordings"
        value={recordingCount === undefined ? '—' : String(recordingCount)}
      />
      <OverviewRow
        icon={<Bookmark className="size-4" strokeWidth={1.6} />}
        label="Words in collection"
        value={wordCount === undefined ? '—' : String(wordCount)}
      />
      <OverviewRow
        icon={<CalendarDays className="size-4" strokeWidth={1.6} />}
        label="Day progress"
        value={`${dayOfJourney} / ${JOURNEY_DAYS} (${journeyPct}%)`}
      />
      <OverviewRow
        icon={<Flame className="size-4" strokeWidth={1.6} />}
        label="Longest streak"
        value={isReady ? longestLabel : '—'}
      />
      <HomeConsistencyInlineBanner />
    </section>
  );
}
