'use client';

import Link from 'next/link';
import { ArrowRight, Bookmark, Clock3, Flame, Mic, NotebookText, Play, Sun } from 'lucide-react';

import { buttonVariants } from '@/components/ui/button';
import { useCollection } from '@/features/collection/use-collection';
import { REVIEW_BATCH_SIZE, useReviewQueue } from '@/features/review/use-review-queue';
import { useRecordings } from '@/features/voice-journal/use-recordings';
import { cn } from '@/lib/utils';

function formatLastRecording(recordingDate?: string): string {
  if (!recordingDate) return 'No recordings yet';

  const date = new Date(recordingDate);
  const today = new Date();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const utcDay = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const diff = Math.round((todayUtc - utcDay) / oneDayMs);

  if (diff === 0) return 'Last recording today';
  if (diff === 1) return 'Last recording yesterday';
  return `Last recording ${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date)}`;
}

export function HomeDashboard() {
  const { queue, isLoading: queueLoading, collectionCount } = useReviewQueue();
  const entries = useCollection();
  const recordings = useRecordings();

  const reviewCaption =
    queueLoading
      ? 'Loading…'
      : collectionCount === 0
        ? 'Save words from today’s paragraph first'
        : `${queue.length} cards · up to ${REVIEW_BATCH_SIZE} per batch`;

  const wordCount = entries?.length;
  const latestWord = entries?.[0]?.word;

  const recordingsCaption =
    recordings === undefined
      ? 'Loading…'
      : recordings.length === 1
        ? '1 total session'
        : `${recordings.length} total sessions`;

  return (
    <div className="min-w-0">
      <div className="flex items-center gap-3 text-ui-sm text-foreground">
        <Sun className="size-4" strokeWidth={1.6} />
        <span>Good morning, Neal.</span>
      </div>

      <section className="mt-16 max-w-3xl space-y-5" aria-labelledby="home-today-heading">
        <h1 id="home-today-heading" className="text-headline-1 text-foreground">
          Your daily reading
          <br />
          practice is ready.
        </h1>
        <p className="text-body text-secondary">
          Just 3 minutes today keeps your progress alive.
        </p>
        <Link
          href="/today"
          className={cn(
            buttonVariants({ variant: 'default', size: 'lg' }),
            'inline-flex h-12 gap-3 rounded-lg px-5 text-ui-sm text-on-primary hover:text-on-primary',
          )}
        >
          <Play className="size-4" strokeWidth={1.8} />
          Start Today&apos;s Session
        </Link>
        <div className="flex flex-wrap items-center gap-4 pt-3 text-caption text-secondary">
          <span className="inline-flex items-center gap-2">
            <Clock3 className="size-4" strokeWidth={1.6} />
            Estimated 3 min
          </span>
          <span className="hidden h-5 border-divider border-l sm:block" aria-hidden="true" />
          <span className="inline-flex items-center gap-2">
            <Flame className="size-4 text-primary" strokeWidth={1.6} />
            Keep your streak going!
          </span>
        </div>
      </section>

      <section
        className="mt-10 border-divider border-t pt-8"
        aria-label="Continue where you left off"
      >
        <h2 className="text-headline-3 text-foreground">Continue where you left off</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          <Link
            href={collectionCount === 0 ? '/today' : '/review'}
            className="group rounded-lg border border-divider bg-surface p-5 transition-colors hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
          >
            <div className="flex items-center gap-3 text-micro-label text-secondary">
              <NotebookText className="size-5" strokeWidth={1.5} />
              Review
            </div>
            <p className="mt-8 text-body text-foreground">
              <span className="text-headline-2">{queueLoading ? '—' : queue.length}</span>{' '}
              cards waiting
            </p>
            <p className="mt-1 text-caption text-secondary">{reviewCaption}</p>
            <p className="mt-8 inline-flex items-center gap-3 text-ui-sm text-foreground">
              Continue Review
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </p>
          </Link>

          <Link
            href="/collection"
            className="group rounded-lg border border-divider bg-surface p-5 transition-colors hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
          >
            <div className="flex items-center gap-3 text-micro-label text-secondary">
              <Bookmark className="size-5" strokeWidth={1.5} />
              Collection
            </div>
            <p className="mt-8 text-body text-foreground">
              <span className="text-headline-2">{wordCount === undefined ? '—' : wordCount}</span>{' '}
              saved words
            </p>
            <p className="mt-1 text-caption text-secondary">
              {latestWord ? `Last added: ${latestWord}` : 'Build your word bank'}
            </p>
            <p className="mt-8 inline-flex items-center gap-3 text-ui-sm text-foreground">
              View Collection
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </p>
          </Link>

          <Link
            href="/voice-journal"
            className="group rounded-lg border border-divider bg-surface p-5 transition-colors hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
          >
            <div className="flex items-center gap-3 text-micro-label text-secondary">
              <Mic className="size-5" strokeWidth={1.5} />
              Voice Journal
            </div>
            <p className="mt-8 text-body text-foreground">
              {formatLastRecording(recordings?.[0]?.recordingDate)}
            </p>
            <p className="mt-1 text-caption text-secondary">{recordingsCaption}</p>
            <p className="mt-8 inline-flex items-center gap-3 text-ui-sm text-foreground">
              Open Voice Journal
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </p>
          </Link>
        </div>
      </section>

    </div>
  );
}
