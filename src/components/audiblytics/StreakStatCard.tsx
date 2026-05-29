'use client';

import { StatCardLight } from '@/components/audiblytics/StatCardLight';
import { useStreak } from '@/features/calendar/use-streak';

function formatStreakBody(streak: number): string {
  if (streak === 1) return '1 day in a row';
  return `${streak} days in a row`;
}

export type StreakStatCardProps = {
  className?: string;
};

export function StreakStatCard({ className }: StreakStatCardProps) {
  const streak = useStreak();
  const body = formatStreakBody(streak);
  return (
    <StatCardLight
      label="STREAK"
      body={body}
      ariaLabel={`Streak: ${body}`}
      className={className}
    />
  );
}
