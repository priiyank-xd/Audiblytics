'use client';

import { ChartNoAxesColumnIncreasing, Star } from 'lucide-react';

import { useCollection } from '@/features/collection/use-collection';
import { useRecordings } from '@/features/voice-journal/use-recordings';
import { useDistinctDayOfUse } from '@/lib/day-counter/use-distinct-day-of-use';
import { cn } from '@/lib/utils';

const JOURNEY_DAYS = 30;

function TodaysFocusChart({ className }: { className?: string }) {
  return (
    <svg
      className={cn('shrink-0 text-primary', className)}
      viewBox="0 0 88 72"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="68" cy="16" r="14" className="fill-surface-elevated" />
      <path
        d="M8 52 C 24 48, 36 34, 52 30 S 72 18, 68 16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.45"
      />
      <circle cx="8" cy="52" r="2.5" fill="currentColor" opacity="0.45" />
      <circle cx="52" cy="30" r="2.5" fill="currentColor" opacity="0.65" />
      <circle cx="68" cy="16" r="2.5" fill="currentColor" />
    </svg>
  );
}

export function TodaysFocusCard({ compact = false }: { compact?: boolean }) {
  return (
    <article
      aria-label="Today's focus: Clarity over speed"
      className={cn(
        'relative min-h-0 overflow-hidden rounded-home-card border border-divider bg-surface-card shadow-sm',
        compact ? 'flex h-full min-h-0 p-home-card' : 'p-5',
      )}
    >
      <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 font-sans text-ui-sm text-secondary">
            <Star className="size-4 shrink-0 text-primary" strokeWidth={1.6} />
            Today&apos;s focus
          </p>
          <h3 className={cn('font-serif text-headline-3 text-foreground', compact ? 'mt-3' : 'mt-4')}>
            Clarity over speed.
          </h3>
          <p className="mt-1 font-sans text-caption text-secondary">Speak slow, speak clear.</p>
        </div>
        <TodaysFocusChart className={compact ? 'h-16 w-20' : 'h-14 w-20'} />
      </div>
    </article>
  );
}

export function MonthlyProgressCard({ compact = false }: { compact?: boolean }) {
  const entries = useCollection();
  const recordings = useRecordings();
  const distinctDays = useDistinctDayOfUse();

  const wordCount = entries?.length;
  const recordingCount = recordings?.length;
  const dayOfJourney = Math.min(distinctDays, JOURNEY_DAYS);
  const journeyPct = Math.round((dayOfJourney / JOURNEY_DAYS) * 100);

  return (
    <section
      aria-label="Progress this month"
      className={cn(
        'min-h-0 overflow-hidden rounded-home-card border border-divider bg-surface-card shadow-sm',
        compact ? 'flex h-full min-h-0 flex-col p-home-card' : 'p-5',
      )}
    >
      <h2 className="inline-flex items-center gap-2 font-sans text-ui-sm text-foreground">
        <ChartNoAxesColumnIncreasing className="size-4 text-primary" strokeWidth={1.6} />
        Progress this month
      </h2>
      <dl
        className={cn(
          'grid grid-cols-3 gap-2 text-center text-foreground',
          compact ? 'mt-4' : 'mt-6',
        )}
      >
        <div>
          <dt className={compact ? 'font-serif text-headline-3' : 'text-headline-2'}>
            {recordingCount === undefined ? '—' : recordingCount}
          </dt>
          <dd className="mt-1 font-sans text-caption text-secondary">Recordings</dd>
        </div>
        <div>
          <dt className={compact ? 'font-serif text-headline-3' : 'text-headline-2'}>
            {wordCount === undefined ? '—' : wordCount}
          </dt>
          <dd className="mt-1 font-sans text-caption text-secondary">Words saved</dd>
        </div>
        <div>
          <dt className={compact ? 'font-serif text-headline-3' : 'text-headline-2'}>
            {dayOfJourney}/{JOURNEY_DAYS}
          </dt>
          <dd className="mt-1 font-sans text-caption text-secondary">Days practiced</dd>
        </div>
      </dl>
      <div className={cn('mt-auto', compact ? 'pt-4' : 'mt-5')}>
        <div className="h-1 overflow-hidden rounded-full bg-surface-elevated">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${journeyPct}%` }}
            role="progressbar"
            aria-valuenow={dayOfJourney}
            aria-valuemin={0}
            aria-valuemax={JOURNEY_DAYS}
            aria-label={`${journeyPct}% of monthly journey complete`}
          />
        </div>
        <div className="mt-2 flex justify-end font-sans text-caption text-secondary">
          <span>{journeyPct}%</span>
        </div>
      </div>
    </section>
  );
}
