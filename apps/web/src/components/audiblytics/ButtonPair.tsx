'use client';

import type { RefObject } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type Day14Choice = 'yes' | 'no';

export type ButtonPairProps = {
  onYes: () => void;
  onNo: () => void;
  className?: string;
  yesButtonRef?: RefObject<HTMLButtonElement | null>;
  /** Which side was chosen (outcome phase); null = awaiting decision. */
  chosen?: Day14Choice | null;
  committing?: boolean;
};

/** Day-14 binary self-report: forest (yes) + brick (no). Story 7.4 persistence via gate callbacks. */
export function ButtonPair({
  onYes,
  onNo,
  className,
  yesButtonRef,
  chosen = null,
  committing = false,
}: ButtonPairProps) {
  const yesMuted = chosen === 'no';
  const noMuted = chosen === 'yes';

  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:justify-center', className)}>
      <Button
        ref={yesButtonRef}
        type="button"
        size="lg"
        disabled={committing || chosen !== null}
        className={cn(
          'min-h-10 flex-1 sm:max-w-xs',
          yesMuted
            ? 'bg-sage-dim text-on-primary hover:bg-sage-dim'
            : 'bg-primary text-primary-foreground hover:bg-primary-hover',
        )}
        onClick={onYes}
      >
        Yes, I hear it
      </Button>
      <Button
        type="button"
        size="lg"
        disabled={committing || chosen !== null}
        className={cn(
          'min-h-10 flex-1 sm:max-w-xs',
          noMuted
            ? 'bg-rose-dim text-on-danger hover:bg-rose-dim'
            : 'bg-brick text-on-danger hover:bg-brick-deep',
        )}
        onClick={onNo}
      >
        No, not really
      </Button>
    </div>
  );
}
