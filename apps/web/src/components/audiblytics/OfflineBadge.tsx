'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export type OfflineBadgeProps = {
  className?: string;
};

const OFFLINE_TOOLTIP = 'This day used the offline pack.';

function PackGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 8 8"
      width={8}
      height={8}
      className={className}
      aria-hidden
    >
      <rect x="1" y="1" width="6" height="6" rx="0.5" fill="currentColor" opacity="0.35" />
      <path
        d="M2 3.5h4M2 5h4"
        stroke="currentColor"
        strokeWidth="0.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function OfflineBadge({ className }: OfflineBadgeProps) {
  return (
    <TooltipProvider delay={200}>
      <Tooltip>
        <TooltipTrigger
          type="button"
          className={cn(
            'inline-flex size-2 shrink-0 items-center justify-center text-ink-faint',
            'rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1',
            className,
          )}
          aria-label="Offline pack session"
        >
          <PackGlyph />
        </TooltipTrigger>
        <TooltipContent>{OFFLINE_TOOLTIP}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
