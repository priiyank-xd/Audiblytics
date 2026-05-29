'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { MainContentShell } from '@/components/audiblytics/MainContentShell';
import { StatRail } from '@/components/audiblytics/StatRail';
import { StatRailCalendar } from '@/components/audiblytics/StatRailCalendar';
import { StatRailCards } from '@/components/audiblytics/StatRailCards';
import { cn } from '@/lib/utils';

export type AppShellProps = {
  children: ReactNode;
};

/** Two-column shell: 70% main · 30% statistics rail (always side-by-side). */
export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname() ?? '';
  const isToday = pathname === '/today';

  return (
    <div
      className={cn(
        'grid min-w-0 w-full grid-cols-1 items-start gap-10',
        !isToday && 'xl:grid-cols-3',
      )}
    >
      <MainContentShell>{children}</MainContentShell>
      {!isToday ? (
        <StatRail>
          <StatRailCalendar />
          <StatRailCards />
        </StatRail>
      ) : null}
    </div>
  );
}
