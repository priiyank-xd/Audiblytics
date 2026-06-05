import { reviewProgressPercent } from '@/lib/review/review-session';
import { cn } from '@/lib/utils';

export type ReviewProgressRingProps = {
  reviewedCount: number;
  total: number;
  className?: string;
};

export function ReviewProgressRing({ reviewedCount, total, className }: ReviewProgressRingProps) {
  const pct = reviewProgressPercent(reviewedCount, total);
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div
      className={cn(
        'rounded-lg border border-divider bg-surface-card px-5 py-4',
        className,
      )}
    >
      <p className="text-micro-label text-tertiary">Today&apos;s progress</p>
      <div className="mt-4 flex flex-col items-center gap-3">
        <div className="relative size-28">
          <svg
            className="size-full -rotate-90"
            viewBox="0 0 100 100"
            role="img"
            aria-label={`${reviewedCount} of ${total} words reviewed, ${pct} percent`}
          >
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              className="stroke-surface-elevated"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              className="stroke-primary transition-[stroke-dashoffset] duration-300 motion-reduce:transition-none"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-headline-3 text-primary">{pct}%</span>
          </div>
        </div>
        <p className="text-ui-sm text-foreground">
          {reviewedCount} / {total} words reviewed
        </p>
        {reviewedCount > 0 ? (
          <p className="text-caption text-secondary">Keep going! You&apos;re doing great.</p>
        ) : null}
      </div>
    </div>
  );
}
