'use client';

import { CheckCircle2, Circle } from 'lucide-react';

import { formatUtcDate } from '@/lib/day-counter/format-utc-date';
import { useCompletions } from '@/features/calendar/use-completions';
import { cn } from '@/lib/utils';

export type TodaySessionStatusProps = {
  paragraphOnScreen: boolean;
  className?: string;
};

type StatusItemProps = {
  label: string;
  complete: boolean;
};

function StatusItem({ label, complete }: StatusItemProps) {
  const Icon = complete ? CheckCircle2 : Circle;

  return (
    <li
      className={cn(
        'inline-flex items-center gap-2 text-caption',
        complete ? 'text-primary' : 'text-tertiary',
      )}
    >
      <Icon className="size-4" strokeWidth={1.6} aria-hidden />
      <span>{label}</span>
    </li>
  );
}

export function TodaySessionStatus({ paragraphOnScreen, className }: TodaySessionStatusProps) {
  const completions = useCompletions() ?? {};
  const today = completions[formatUtcDate()];
  const hasReadIt = today?.hasReadIt === true;
  const hasRecording = today?.hasRecording === true;

  return (
    <section
      aria-label="Today session status"
      className={cn(
        'rounded-lg border border-divider bg-surface-elevated px-4 py-3',
        className,
      )}
    >
      <ul className="flex flex-wrap gap-x-5 gap-y-2">
        <StatusItem label="Paragraph ready" complete={paragraphOnScreen} />
        <StatusItem label="Read marked" complete={hasReadIt} />
        <StatusItem label="Recording saved" complete={hasRecording} />
      </ul>
      {paragraphOnScreen && (hasReadIt || hasRecording) ? (
        <p className="mt-2 text-caption text-secondary">
          Today is counted. You can still save words or record another take.
        </p>
      ) : null}
    </section>
  );
}
