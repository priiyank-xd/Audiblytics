'use client';

import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export type StatRailProps = {
  children?: ReactNode;
};

export function StatRail({ children }: StatRailProps) {
  return (
    <aside
      aria-label="Statistics"
      className={cn(
        'min-w-0 shrink-0 xl:col-span-1',
        'xl:sticky xl:top-8 xl:self-start',
      )}
    >
      <div
        className={cn(
          'flex min-w-0 flex-col border-divider border-t pt-8 xl:border-l xl:border-t-0 xl:pl-10',
        )}
      >
        {children}
      </div>
    </aside>
  );
}
