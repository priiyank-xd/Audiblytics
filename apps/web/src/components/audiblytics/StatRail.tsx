'use client';

import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export type StatRailProps = {
  children?: ReactNode;
  innerClassName?: string;
  /** Home dashboard: fixed-width column with reference-sized cards. */
  homeFixed?: boolean;
};

export function StatRail({ children, innerClassName, homeFixed }: StatRailProps) {
  return (
    <aside
      aria-label="Statistics"
      className={cn(
        'min-w-0 shrink-0',
        homeFixed
          ? 'hidden h-full min-h-0 w-home-rail overflow-hidden lg:block'
          : 'xl:col-span-1 xl:sticky xl:top-8 xl:self-start',
      )}
    >
      <div
        className={cn(
          'flex min-w-0 flex-col',
          homeFixed
            ? 'h-full min-h-0 w-full overflow-hidden'
            : 'border-divider border-t pt-8 xl:border-l xl:border-t-0 xl:pl-10',
          innerClassName,
        )}
      >
        {children}
      </div>
    </aside>
  );
}
