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
};

export function StreakStatCard({ className, variant = 'default', compact = false }: StreakStatCardProps) {
  const streak = useStreak();
  const body = formatFeaturedStreakBody(streak);

  if (variant === 'featured') {
    const streakLabel =
      streak === 0 ? '0 day' : streak === 1 ? '1 day' : `${streak} days`;

    return (
      <article
        aria-label={`Current streak: ${streakLabel}. ${body}`}
        className={cn(
          'flex h-home-streak min-h-0 items-center justify-between gap-4 rounded-home-card border border-divider bg-surface-card p-home-rail-card',
          compact ? 'h-full' : 'p-home-rail-card',
          className,
        )}
      >
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 font-sans text-ui-sm text-secondary">
            <Flame className="size-3.5 shrink-0" strokeWidth={1.5} />
            Current streak
          </p>
          <p className="mt-6 text-home-streak-number text-foreground">{streakLabel}</p>
          <p className="mt-4 font-sans text-ui-sm text-tertiary">{body}</p>
        </div>
        <div
          className="flex size-home-streak-ring shrink-0 items-center justify-center rounded-full border border-divider"
          aria-hidden="true"
        >
          <Flame className="size-8 text-divider" strokeWidth={1.5} />
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
