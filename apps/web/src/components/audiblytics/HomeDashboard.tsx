'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  ArrowRight,
  Bookmark,
  Clock3,
  Mic,
  NotebookText,
  Play,
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
      className="group flex h-home-continue-card flex-col rounded-home-card border border-divider bg-surface-card p-home-card transition-shadow hover:border-primary/15 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
    >
      <div className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
          {icon}
        </span>
        <span className="font-sans text-ui-sm text-foreground">{label}</span>
      </div>
      <div className="mt-5 text-foreground">{metric}</div>
      {progressPct !== undefined ? (
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-surface-elevated">
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
      {caption ? <p className="mt-2 font-sans text-caption text-secondary">{caption}</p> : null}
      <p className="mt-auto inline-flex items-center gap-2 font-sans text-ui-sm text-primary">
        {actionLabel}
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
      </p>
    </Link>
  );
}

function HomeHeroIllustration() {
  return (
    <div
      className="pointer-events-none relative z-0 flex h-full min-h-0 max-h-home-hero items-end justify-center md:col-span-2"
      aria-hidden="true"
    >
      <Image
        src="/images/home-hero-illustration.png"
        alt=""
        width={320}
        height={400}
        priority
        className="h-full max-h-home-hero w-auto max-w-none object-contain object-bottom"
      />
    </div>
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
        : `${queue.length} cards — up to ${REVIEW_BATCH_SIZE} per batch`;

  return (
    <div className="flex min-h-0 flex-col">
      <section aria-labelledby="home-today-heading">
        <div className="grid min-h-home-hero grid-cols-1 items-end gap-8 md:grid-cols-5">
          <div className="relative z-10 md:col-span-3">
            <p className="text-home-greeting">{greeting}</p>
            <h1 id="home-today-heading" className="mt-4 text-home-headline text-foreground">
              Let&apos;s build your confidence today.
            </h1>
            <p className="mt-4 max-w-lg text-home-description">
              A few minutes of focused practice can create a big difference.
            </p>
            <Link
              href="/today"
              className={cn(
                'mt-8 inline-flex h-home-btn items-center gap-3 rounded-home-btn bg-primary px-home-btn font-sans text-ui text-on-primary shadow-sm transition-colors hover:bg-primary-hover hover:text-on-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2',
              )}
            >
              <Play className="size-5" strokeWidth={1.8} fill="currentColor" />
              Start Today&apos;s Session
            </Link>
            <div className="mt-4 flex items-center gap-2 font-sans text-caption text-secondary">
              <Clock3 className="size-4" strokeWidth={1.6} />
              Estimated time: 3 min
            </div>
          </div>
          <HomeHeroIllustration />
        </div>
      </section>

      <section
        className="mt-home-section shrink-0 border-t border-divider pt-8"
        aria-label="Continue where you left off"
      >
        <h2 className="font-serif text-headline-3 text-foreground">Continue where you left off</h2>
        <div className="mt-6 grid grid-cols-1 gap-home-continue sm:grid-cols-3">
          <HomeContinueCard
            href={collectionCount === 0 ? '/today' : '/review'}
            icon={<NotebookText className="size-4" strokeWidth={1.5} />}
            label="Review"
            metric={
              queueLoading ? (
                <p className="font-sans text-ui-sm">Loading…</p>
              ) : (
                <p className="font-sans text-ui-sm">
                  <span className="mr-2 font-serif text-headline-2">{queue.length}</span>
                  cards waiting
                </p>
              )
            }
            caption={reviewCaption}
            actionLabel="Continue"
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
                  <span className="mr-2 font-serif text-headline-2">{wordCount}</span>
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
              <p className="font-sans text-ui-sm">
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
