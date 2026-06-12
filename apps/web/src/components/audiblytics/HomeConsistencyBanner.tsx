import Link from 'next/link';
import { ChevronRight, Leaf } from 'lucide-react';

/** Full-width home footer — fixed height, spans main + stat rail (UX-V2-UI2). */
export function HomeConsistencyBanner() {
  return (
    <Link
      href="/journey"
      className="group mt-home-section flex h-home-banner shrink-0 items-center justify-between gap-4 overflow-hidden rounded-home-banner bg-surface-elevated px-home-banner transition-colors hover:bg-cream-dim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
    >
      <span className="flex items-center gap-4">
        <span className="flex size-10 items-center justify-center rounded-full bg-primary-soft text-primary">
          <Leaf className="size-5" strokeWidth={1.6} />
        </span>
        <span className="font-sans text-ui-sm text-foreground">Consistency is the key to fluency.</span>
      </span>
      <ChevronRight
        className="size-5 shrink-0 text-secondary transition-transform group-hover:translate-x-1"
        strokeWidth={1.7}
        aria-hidden="true"
      />
    </Link>
  );
}
