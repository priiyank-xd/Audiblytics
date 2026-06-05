import { cn } from '@/lib/utils';

export type TodayLiveFeedbackStretchProps = {
  className?: string;
};

const PLACEHOLDER_METRICS = [
  { label: 'Pace' },
  { label: 'Clarity' },
  { label: 'Accuracy' },
] as const;

export function TodayLiveFeedbackStretch({ className }: TodayLiveFeedbackStretchProps) {
  return (
    <section
      className={cn(
        'rounded-lg border border-divider bg-surface px-5 py-5',
        className,
      )}
      aria-label="Live feedback"
      aria-disabled="true"
    >
      <h2 className="text-ui font-semibold text-foreground">Live feedback</h2>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {PLACEHOLDER_METRICS.map(({ label }) => (
          <div
            key={label}
            className="rounded-lg border border-divider px-3 py-3"
            aria-disabled="true"
          >
            <p className="text-caption text-secondary">{label}</p>
            <p className="mt-2 text-ui-sm font-semibold text-secondary">—</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-caption text-secondary">Coming soon</p>
    </section>
  );
}
