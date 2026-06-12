'use client';

import { Flame } from 'lucide-react';

import { StatCardLight } from '@/components/audiblytics/StatCardLight';
import { StreakProgressRing } from '@/components/audiblytics/StreakProgressRing';
import { useStreak } from '@/features/calendar/use-streak';
import { cn } from '@/lib/utils';

const STREAK_RING_GOAL_DAYS = 7;

function streakRingPercent(streak: number): number {
  if (streak <= 0) return 8;
  return Math.round((Math.min(streak, STREAK_RING_GOAL_DAYS) / STREAK_RING_GOAL_DAYS) * 100);
}

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
          'flex items-center justify-between gap-4 rounded-home-card bg-home-streak-gradient text-on-primary shadow-sm',
          compact ? 'h-full min-h-0 p-home-card' : 'gap-4 p-5',
          className,
        )}
      >
        <div className="flex items-start gap-3">
          <Flame
            className={cn('shrink-0 text-on-primary', compact ? 'mt-0.5 size-5' : 'mt-1 size-5')}
            strokeWidth={1.6}
          />
          <div>
            <p className="font-sans text-caption text-on-primary/90">Current streak</p>
            <p className="mt-1 font-serif text-headline-2 text-on-primary">{streakLabel}</p>
            <p className="mt-1 font-sans text-caption text-on-primary/90">{body}</p>
          </div>
        </div>
        <StreakProgressRing
          percent={streakRingPercent(streak)}
          size={compact ? 'sm' : 'md'}
          showFlame={compact}
        />
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
