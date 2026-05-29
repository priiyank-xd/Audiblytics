import Link from 'next/link';

import { cn } from '@/lib/utils';

export type BackToHomeLinkProps = {
  className?: string;
};

/** Hub-and-spoke return affordance — links to `/`, not browser history (UX layout revision). */
export function BackToHomeLink({ className }: BackToHomeLinkProps) {
  return (
    <Link
      href="/"
      className={cn(
        'inline-flex text-ui text-tertiary transition-colors hover:text-forest',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2',
        className,
      )}
    >
      ← Home
    </Link>
  );
}
