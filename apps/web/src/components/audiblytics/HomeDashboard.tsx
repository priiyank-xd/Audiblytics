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
};

function HomeContinueCard({
  href,
  icon,
  label,
  metric,
  caption,
  actionLabel,
}: HomeContinueCardProps) {
  return (
    <Link
      href={href}
      className="group flex flex-col items-center px-0 py-0.5 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
    >
      <div className="flex items-center justify-center gap-2.5 text-home-continue-eyebrow">
        <span className="shrink-0">{icon}</span>
        {label}
      </div>
      <div className="mt-3.5 font-sans text-ui-sm text-foreground">{metric}</div>
      {caption ? (
        <p className="mt-1 font-sans text-caption text-home-ink-muted">{caption}</p>
      ) : null}
      <span className="mt-3.5 inline-flex items-center gap-1.5 font-sans text-ui-sm font-medium text-primary">
        {actionLabel}
        <ArrowRight className="size-3.5" strokeWidth={2} />
      </span>
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

  const reviewCaption =
    queueLoading
      ? undefined
      : collectionCount === 0
        ? 'Save words from today’s paragraph first'
        : `${queue.length} cards · up to ${REVIEW_BATCH_SIZE} per batch`;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto px-home-main py-home-main">
      <Link
        href="/settings"
        className="absolute right-home-main top-home-main inline-flex items-center gap-2 font-sans text-ui-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 max-lg:right-0 max-lg:top-0"
      >
        <Settings className="size-[1.125rem]" strokeWidth={1.6} />
        Settings
      </Link>

      <section aria-labelledby="home-today-heading">
        <div className="mt-home-greeting inline-flex items-center gap-2.5 text-home-ink-muted">
          <Sun className="size-[1.125rem] shrink-0" strokeWidth={1.6} aria-hidden="true" />
          <p className="text-home-greeting">{greeting}</p>
        </div>

        <h1 id="home-today-heading" className="mt-5 text-home-headline text-foreground">
          Let&apos;s strengthen your
          <br />
          reading and speaking today.
        </h1>

        <p className="mt-home-hero-sub text-home-description">
          Just 3 minutes of practice keeps your progress alive.
        </p>

        <Link
          href="/today"
          className="mt-home-cta inline-flex items-center gap-2.5 rounded-home-btn bg-primary px-home-cta py-3.5 font-sans text-ui-sm font-medium text-on-primary transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
        >
          <Play className="size-[1.125rem] fill-current" strokeWidth={0} />
          Start Today&apos;s Session
        </Link>

        <div className="mt-home-meta flex flex-wrap items-center gap-home-meta font-sans text-ui-sm text-home-ink-muted">
          <span className="inline-flex items-center gap-2">
            <Clock3 className="size-4" strokeWidth={1.6} />
            Estimated 3 min
          </span>
          <span className="inline-flex items-center gap-2">
            <Flame className="size-4 fill-primary text-primary" strokeWidth={1.4} />
            Keep your streak going!
          </span>
        </div>
      </section>

      <div className="my-home-divider h-px bg-divider" role="presentation" />

      <section aria-label="Continue where you left off">
        <div className="grid grid-cols-1 justify-items-center gap-home-continue text-center sm:grid-cols-3">
          <HomeContinueCard
            href={collectionCount === 0 ? '/today' : '/review'}
            icon={<NotebookText className="size-4" strokeWidth={1.6} />}
            label="Review"
            metric={
              queueLoading ? (
                <span>Loading…</span>
              ) : (
                <>
                  <span className="text-home-continue-number">{queue.length}</span> cards waiting
                </>
              )
            }
            caption={reviewCaption}
            actionLabel="Continue Review"
          />

          <HomeContinueCard
            href="/collection"
            icon={<Bookmark className="size-4" strokeWidth={1.6} />}
            label="Collection"
            metric={
              wordCount === undefined ? (
                <span>Loading…</span>
              ) : (
                <>
                  <span className="text-home-continue-number">{wordCount}</span> saved words
                </>
              )
            }
            caption={latestWord ? `Last added: ${latestWord}` : 'Build your word bank'}
            actionLabel="View Collection"
          />

          <HomeContinueCard
            href="/voice-journal"
            icon={<Mic className="size-4" strokeWidth={1.6} />}
            label="Voice Journal"
            metric={formatLastRecording(recordings?.[0]?.recordingDate)}
            caption={recordingsCaption}
            actionLabel="Open Voice Journal"
          />
        </div>
      </section>
    </div>
  );
}
