import { cn } from '@/lib/utils';

export type StatCardLightProps = {
  /** ALL-CAPS micro-label (e.g. STREAK). */
  label: string;
  /** Primary stat line (e.g. 3 days). */
  body: string;
  /** Accessible name for the card (e.g. Streak: 3 days). */
  ariaLabel: string;
  className?: string;
};

/** Right-rail stat card — cream surface, quiet typography (UX-DR16). */
export function StatCardLight({ label, body, ariaLabel, className }: StatCardLightProps) {
  return (
    <article
      aria-label={ariaLabel}
      className={cn(
        'rounded-sm border border-divider bg-surface p-4',
        className,
      )}
    >
      <p className="text-ui-sm font-medium uppercase tracking-wide text-tertiary">{label}</p>
      <p className="mt-2 text-body text-primary">{body}</p>
    </article>
  );
}
