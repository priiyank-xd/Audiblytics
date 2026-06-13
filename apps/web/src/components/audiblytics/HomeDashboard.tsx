'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  ArrowRight,
  Bookmark,
  Clock3,
  Flame,
  Mic,
  NotebookText,
  Play,
  Settings,
  Sun,
} from 'lucide-react';

import { useAuth } from '@/features/auth/auth-context';
import { useCollection } from '@/features/collection/use-collection';
import { REVIEW_BATCH_SIZE, useReviewQueue } from '@/features/review/use-review-queue';
import { useRecordings } from '@/features/voice-journal/use-recordings';
import { isApiStorageBackend } from '@/lib/config/storage-backend';
import {
  formatHomeGreeting,
  resolveTimeOfDayGreeting,
} from '@/lib/navigation/home-greeting';
import { resolveSidebarProfileLabel } from '@/lib/navigation/sidebar-profile';
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

type HomeContinueCardProps = {
  href: string;
  icon: ReactNode;
  label: string;
  metric: ReactNode;
  caption?: string;
  actionLabel: string;
  progressPct?: number;
};

function HomeContinueCard({
  href,
  icon,
  label,
  metric,
  caption,
  actionLabel,
  progressPct,
}: HomeContinueCardProps) {
  return (
    <Link
      href={href}
      className="group flex h-home-continue-card min-h-0 flex-col rounded-home-card border border-divider bg-surface-card p-home-continue-card transition-colors hover:border-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
    >
      <div className="flex items-center gap-2.5">
        <span className="shrink-0 text-foreground">{icon}</span>
        <span className="text-home-continue-eyebrow">{label}</span>
      </div>
      <div className="mt-9 text-foreground">{metric}</div>
      {progressPct !== undefined ? (
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-elevated">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progressPct}%` }}
            role="progressbar"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Review progress ${progressPct}%`}
          />
        </div>
      ) : null}
      {caption ? (
        <p className="mt-2 font-sans text-caption text-tertiary">{caption}</p>
      ) : null}
      <p className="mt-auto inline-flex items-center gap-2 font-sans text-ui-sm text-primary">
        {actionLabel}
        <ArrowRight className="size-3.5" strokeWidth={1.75} />
      </p>
    </Link>
  );
}

export function HomeDashboard() {
  const apiMode = isApiStorageBackend();
  const { user, loading } = useAuth();
  const { queue, isLoading: queueLoading, collectionCount } = useReviewQueue();
  const entries = useCollection();
  const recordings = useRecordings();

  const displayName = resolveSidebarProfileLabel({
    apiMode,
    userEmail: user?.email,
    loading: apiMode && loading,
  });
  const greeting = formatHomeGreeting(
    resolveTimeOfDayGreeting(new Date().getHours()),
    displayName,
    apiMode && loading,
  );

  const wordCount = entries?.length;
  const latestWord = entries?.[0]?.word;

  const recordingsCaption =
    recordings === undefined
      ? 'Loading…'
      : recordings.length === 1
        ? '1 total session'
        : `${recordings.length} total sessions`;

  const reviewProgressPct =
    !queueLoading && queue.length > 0
      ? Math.round((Math.min(queue.length, REVIEW_BATCH_SIZE) / REVIEW_BATCH_SIZE) * 100)
      : undefined;

  const reviewCaption =
    queueLoading
      ? undefined
      : collectionCount === 0
        ? 'Save words from today’s paragraph first'
        : `${queue.length} cards · up to ${REVIEW_BATCH_SIZE} per batch`;

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-y-auto overflow-x-hidden lg:overflow-hidden">
      <Link
        href="/settings"
        className="absolute right-0 top-0 z-10 inline-flex items-center gap-2 font-sans text-ui-sm text-secondary transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
      >
        <Settings className="size-4" strokeWidth={1.5} />
        Settings
      </Link>

      <section aria-labelledby="home-today-heading" className="max-w-home-main shrink-0">
        <div className="inline-flex items-center gap-2.5">
          <Sun className="size-4 shrink-0 text-foreground" strokeWidth={1.5} aria-hidden="true" />
          <p className="text-home-greeting">{greeting}</p>
        </div>
        <h1 id="home-today-heading" className="mt-6 text-home-headline text-foreground">
          Let&apos;s strengthen your reading and speaking today.
        </h1>
        <p className="mt-7 text-home-description">
          Just 3 minutes of practice keeps your progress alive.
        </p>
        <Link
          href="/today"
          className={cn(
            'mt-7 inline-flex h-home-btn items-center gap-3 rounded-home-btn bg-primary px-home-btn font-sans text-ui-sm text-on-primary transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2',
          )}
        >
          <Play className="size-4" strokeWidth={1.75} />
          Start Today&apos;s Session
        </Link>
        <div className="mt-7 flex flex-wrap items-center gap-8 font-sans text-caption text-secondary">
          <span className="inline-flex items-center gap-2">
            <Clock3 className="size-3.5" strokeWidth={1.5} />
            Estimated 3 min
          </span>
          <span className="inline-flex items-center gap-2">
            <Flame className="size-3.5" strokeWidth={1.5} />
            Keep your streak going!
          </span>
        </div>
      </section>

      <section
        className="mt-home-section shrink-0 border-t border-divider pt-home-divider pb-home-divider lg:max-h-home-continue-section"
        aria-label="Continue where you left off"
      >
        <h2 className="text-home-section-title text-foreground">Continue where you left off</h2>
        <div className="mt-7 grid min-h-0 grid-cols-1 gap-home-continue sm:grid-cols-3">
          <HomeContinueCard
            href={collectionCount === 0 ? '/today' : '/review'}
            icon={<NotebookText className="size-4" strokeWidth={1.5} />}
            label="Review"
            metric={
              queueLoading ? (
                <p className="font-sans text-ui-sm">Loading…</p>
              ) : (
                <p className="font-sans text-ui-sm">
                  <span className="mr-2 text-home-continue-number">{queue.length}</span>
                  cards waiting
                </p>
              )
            }
            caption={reviewCaption}
            actionLabel="Continue Review"
            progressPct={reviewProgressPct}
          />

          <HomeContinueCard
            href="/collection"
            icon={<Bookmark className="size-4" strokeWidth={1.5} />}
            label="Collection"
            metric={
              wordCount === undefined ? (
                <p className="font-sans text-ui-sm">Loading…</p>
              ) : (
                <p className="font-sans text-ui-sm">
                  <span className="mr-2 text-home-continue-number">{wordCount}</span>
                  saved words
                </p>
              )
            }
            caption={latestWord ? `Last added: ${latestWord}` : 'Build your word bank'}
            actionLabel="View Collection"
          />

          <HomeContinueCard
            href="/voice-journal"
            icon={<Mic className="size-4" strokeWidth={1.5} />}
            label="Voice Journal"
            metric={
              <p className="font-sans text-ui-sm font-medium">
                {formatLastRecording(recordings?.[0]?.recordingDate)}
              </p>
            }
            caption={recordingsCaption}
            actionLabel="Open Journal"
          />
        </div>
      </section>
    </div>
  );
}
