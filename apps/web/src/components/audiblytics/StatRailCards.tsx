'use client';

import { Bookmark, ChartNoAxesColumnIncreasing, Flame, Mic } from 'lucide-react';

import { useCollection } from '@/features/collection/use-collection';
import { useStreak } from '@/features/calendar/use-streak';
import { useRecordings } from '@/features/voice-journal/use-recordings';
import { useDistinctDayOfUse } from '@/lib/day-counter/use-distinct-day-of-use';

const JOURNEY_DAYS = 30;

export function StatRailCards() {
  const entries = useCollection();
  const recordings = useRecordings();
  const distinctDays = useDistinctDayOfUse();
  const streak = useStreak();

  const wordCount = entries?.length;
  const recordingCount = recordings?.length;
  const dayOfJourney = Math.min(distinctDays, JOURNEY_DAYS);
  const journeyPct = Math.round((dayOfJourney / JOURNEY_DAYS) * 100);

  return (
    <div className="mt-8 min-w-0 border-divider border-t pt-6" aria-label="Progress metrics">
      <h2 className="text-headline-3 text-foreground">Overview</h2>
      <div className="mt-5 space-y-5">
        <div className="flex items-center gap-4 text-ui-sm text-foreground">
          <Flame className="size-5 text-secondary" strokeWidth={1.6} />
          <span>Streak</span>
          <span className="ml-auto font-medium">{streak} day</span>
        </div>
        <div className="flex items-center gap-4 text-ui-sm text-foreground">
          <Mic className="size-5 text-secondary" strokeWidth={1.6} />
          <span>Recordings</span>
          <span className="ml-auto font-medium">
            {recordingCount === undefined ? '—' : recordingCount}
          </span>
        </div>
        <div className="flex items-center gap-4 text-ui-sm text-foreground">
          <Bookmark className="size-5 text-secondary" strokeWidth={1.6} />
          <span>Words in collection</span>
          <span className="ml-auto font-medium">{wordCount === undefined ? '—' : wordCount}</span>
        </div>
        <div className="flex items-center gap-4 text-ui-sm text-foreground">
          <ChartNoAxesColumnIncreasing className="size-5 text-secondary" strokeWidth={1.6} />
          <span>Day progress</span>
          <span className="ml-auto font-medium">
            {dayOfJourney} / {JOURNEY_DAYS} ({journeyPct}%)
          </span>
        </div>
      </div>

      <p className="mt-8 rounded-lg bg-surface-elevated px-5 py-4 text-caption text-secondary">
        <span className="border-primary border-l pl-4">Consistency is the key to fluency.</span>
      </p>
    </div>
  );
}
