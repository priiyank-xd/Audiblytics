'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { HomeConsistencyBanner } from '@/components/audiblytics/HomeConsistencyBanner';
import { MainContentShell } from '@/components/audiblytics/MainContentShell';
import { StatRail } from '@/components/audiblytics/StatRail';
import { StatRailHome } from '@/components/audiblytics/StatRailHome';

export type AppShellProps = {
  children: ReactNode;
};

function HomeAppShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-home-content flex-col overflow-hidden">
      <div className="grid min-h-0 flex-1 grid-cols-1 items-stretch overflow-hidden lg:grid-cols-[minmax(0,1fr)_var(--home-rail-width)] lg:gap-home-section">
        <MainContentShell>{children}</MainContentShell>
        <StatRail homeFixed>
          <StatRailHome compact />
        </StatRail>
      </div>
      <HomeConsistencyBanner />
    </div>
  );
}

/** Home includes the calendar statistics rail; other routes are main content only. */
export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname() ?? '';
  const isHome = pathname === '/';

  if (isHome) {
    return <HomeAppShell>{children}</HomeAppShell>;
  }

  return (
    <div className="grid min-w-0 w-full grid-cols-1 items-start">
      <MainContentShell>{children}</MainContentShell>
    </div>
  );
}
