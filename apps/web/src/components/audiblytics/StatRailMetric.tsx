import { cn } from '@/lib/utils';

export type StatRailMetricProps = {
  /** ALL-CAPS micro-label (e.g. STREAK). */
  label: string;
  /** Primary number or short value. */
  value: string;
  /** Supporting line under the value. */
  caption: string;
  ariaLabel: string;
  className?: string;
};

/** Minimal statistics row — typography only, no card chrome (layout revision). */
export function StatRailMetric({
  label,
  value,
  caption,
  ariaLabel,
  className,
}: StatRailMetricProps) {
  return (
    <div aria-label={ariaLabel} className={cn('min-w-0 space-y-0.5', className)}>
      <p className="text-micro-label text-tertiary">{label}</p>
      <p className="text-headline-3 text-primary tabular-nums sm:text-headline-2">{value}</p>
      <p className="text-caption text-tertiary">{caption}</p>
    </div>
  );
}
