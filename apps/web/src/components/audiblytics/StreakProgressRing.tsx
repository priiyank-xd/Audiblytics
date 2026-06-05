import { Flame } from 'lucide-react';

import { cn } from '@/lib/utils';

export type StreakProgressRingProps = {
  /** 0–100 fill for the ring arc. */
  percent: number;
  className?: string;
  size?: 'sm' | 'md';
  showFlame?: boolean;
};

/** Decorative ring for featured streak card (UX-V2 home mockup). */
export function StreakProgressRing({
  percent,
  className,
  size = 'md',
  showFlame = false,
}: StreakProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const dim = size === 'sm' ? 'size-14' : 'size-16';

  return (
    <div
      className={cn('relative flex shrink-0 items-center justify-center', dim, className)}
      aria-hidden="true"
    >
      <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 44 44">
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          className="stroke-on-primary/25"
          strokeWidth="3"
        />
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          className="stroke-on-primary/80"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      {showFlame ? (
        <Flame className="relative size-5 text-on-primary/90" strokeWidth={1.6} />
      ) : null}
    </div>
  );
}
