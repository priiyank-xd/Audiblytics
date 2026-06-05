'use client';

import { Bookmark, Flame, Target, Trophy } from 'lucide-react';

import { useJourneyStats } from '@/features/journey/use-journey-stats';
import { cn } from '@/lib/utils';

type StatCardProps = {
  icon: typeof Flame;
  label: string;
  value: string;
};

function StatCard({ icon: Icon, label, value }: StatCardProps) {
  return (
    <article
      className={cn(
        'rounded-lg border border-divider bg-surface-card p-4',
        'min-w-0',
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
          <Icon className="size-4" strokeWidth={1.7} aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-caption text-secondary">{label}</p>
          <p className="mt-1 text-headline-3 text-foreground tabular-nums">{value}</p>
        </div>
      </div>
    </article>
  );
}

type JourneyStatsRowProps = {
  ariaLabel?: string;
};

export function JourneyStatsRow({
  ariaLabel = 'Journey statistics',
}: JourneyStatsRowProps) {
  const stats = useJourneyStats();

  const sessionsValue = stats.isReady ? String(stats.sessionsCompleted) : '—';
  const longestValue = stats.isReady ? String(stats.longestStreak) : '—';
  const wordsValue =
    stats.wordsPracticed === undefined ? '—' : String(stats.wordsPracticed);

  return (
    <div
      className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      aria-label={ariaLabel}
    >
      <StatCard icon={Flame} label="Current streak" value={`${stats.currentStreak} days`} />
      <StatCard icon={Target} label="Sessions completed" value={sessionsValue} />
      <StatCard icon={Trophy} label="Longest streak" value={`${longestValue} days`} />
      <StatCard icon={Bookmark} label="Words practiced" value={wordsValue} />
    </div>
  );
}
