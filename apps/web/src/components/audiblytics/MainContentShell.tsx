'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export type MainContentShellProps = {
  children: ReactNode;
};

/**
 * Home uses full width for the dashboard grid; other routes keep a readable column width
 * (excludes centered blog-style layout on the home surface).
 */
export function MainContentShell({ children }: MainContentShellProps) {
  const pathname = usePathname() ?? '';
  const isHome = pathname === '/';
  const isToday = pathname === '/today';

  return (
    <div
      className={cn(
        'min-w-0 w-full',
        isHome && 'flex h-full min-h-0 flex-col overflow-hidden',
        !isHome && !isToday && 'mx-auto max-w-5xl',
      )}
    >
      {children}
    </div>
  );
}
