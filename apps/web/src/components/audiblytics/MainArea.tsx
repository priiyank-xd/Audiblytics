'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export function AppColumn({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{children}</div>
  );
}

/** Scrollable main on feature routes; home fills viewport with Emergent flat layout. */
export function MainArea({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '';
  const isHome = pathname === '/';

  return (
    <main
      className={cn(
        'min-h-0 min-w-0 flex-1',
        isHome
          ? 'flex h-full flex-col overflow-hidden p-0'
          : 'overflow-y-auto px-5 pb-12 pt-8 md:px-8 lg:px-14 lg:pb-16',
      )}
    >
      {children}
    </main>
  );
}
