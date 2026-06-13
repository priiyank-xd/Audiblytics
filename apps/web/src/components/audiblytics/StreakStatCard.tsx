'use client';

import { Flame } from 'lucide-react';

import { StatCardLight } from '@/components/audiblytics/StatCardLight';
import { useStreak } from '@/features/calendar/use-streak';
import { cn } from '@/lib/utils';

function formatFeaturedStreakBody(streak: number): string {
  if (streak === 0) return 'Start your streak today!';
  if (streak === 1) return '1 day in a row';
  return `${streak} days in a row`;
}

function formatDefaultStreakBody(streak: number): string {
  if (streak === 1) return '1 day in a row';
  return `${streak} days in a row`;
}

export type StreakStatCardProps = {
  className?: string;
  variant?: 'default' | 'featured';
  compact?: boolean;
  flat?: boolean;
};

export function StreakStatCard({
  className,
  variant = 'default',
  flat = false,
}: StreakStatCardProps) {
  const streak = useStreak();
  const body = formatFeaturedStreakBody(streak);

  if (variant === 'featured') {
    const streakCount =
      streak === 0 ? '0' : streak === 1 ? '1' : String(streak);
    const streakUnit = streak === 1 ? ' day' : streak === 0 ? ' day' : ' days';

    return (
      <article
        aria-label={`Current streak: ${streakCount}${streakUnit}. ${body}`}
        className={cn(
          'relative px-1.5 py-1',
          flat && 'min-h-0',
          !flat && 'flex items-center justify-between gap-4 rounded-lg border border-divider bg-surface-card p-5',
          className,
        )}
      >
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 font-sans text-caption text-home-ink-muted">
            <Flame className="size-4 shrink-0 text-primary" strokeWidth={1.6} />
            Current streak
          </p>
          <p className="mt-4 text-home-streak-number">
            {streakCount}
            <span className="text-home-streak-unit">{streakUnit}</span>
          </p>
          <p className="mt-2 font-sans text-caption text-home-ink-muted">{body}</p>
        </div>
        <div
          className="absolute right-home-streak-ring top-home-streak-ring flex size-home-streak-ring items-center justify-center rounded-full border-2 border-divider"
          aria-hidden="true"
        >
          <Flame className="size-[1.375rem] text-home-avatar" strokeWidth={1.6} />
        </div>
      </article>
    );
  }

  return (
    <StatCardLight
      label="STREAK"
      body={formatDefaultStreakBody(streak)}
      ariaLabel={`Streak: ${formatDefaultStreakBody(streak)}`}
      className={className}
    />
  );
}
