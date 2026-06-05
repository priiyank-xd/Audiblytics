'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { HomeConsistencyBanner } from '@/components/audiblytics/HomeConsistencyBanner';
import { MainContentShell } from '@/components/audiblytics/MainContentShell';
import { StatRail } from '@/components/audiblytics/StatRail';
import { StatRailHome } from '@/components/audiblytics/StatRailHome';
import { StatRailCalendar } from '@/components/audiblytics/StatRailCalendar';
import { StatRailCards } from '@/components/audiblytics/StatRailCards';
import { cn } from '@/lib/utils';

export type AppShellProps = {
  children: ReactNode;
};

function HomeAppShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-home-content flex-col">
      <div className="grid grid-cols-1 items-start lg:grid-cols-[minmax(0,1fr)_var(--home-rail-width)] lg:gap-home-section">
        <MainContentShell>{children}</MainContentShell>
        <StatRail homeFixed>
          <StatRailHome compact />
        </StatRail>
      </div>
      <HomeConsistencyBanner />
    </div>
  );
}

/** Two-column shell: main · statistics rail. Home uses a fixed viewport grid (no scroll). */
export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname() ?? '';
  const isToday = pathname === '/today';
  const isReview = pathname === '/review';
  const isHome = pathname === '/';
  const showStatRail = !isToday && !isReview;

  if (isHome) {
    return <HomeAppShell>{children}</HomeAppShell>;
  }

  return (
    <div
      className={cn(
        'grid min-w-0 w-full grid-cols-1 items-start',
        showStatRail && 'gap-8 xl:grid-cols-3 xl:gap-10',
      )}
    >
      <MainContentShell>{children}</MainContentShell>
      {showStatRail ? (
        <StatRail>
          <StatRailCalendar />
          <StatRailCards />
        </StatRail>
      ) : null}
    </div>
  );
}
