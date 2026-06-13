'use client';

import { StreakStatCard } from '@/components/audiblytics/StreakStatCard';
import { StatRailCalendar } from '@/components/audiblytics/StatRailCalendar';
import { HomeOverviewCard } from '@/components/audiblytics/StatRailHomeWidgets';

export type StatRailHomeProps = {
  compact?: boolean;
};

export function StatRailHome({ compact = false }: StatRailHomeProps) {
  if (compact) {
    return (
      <div className="flex min-h-0 w-full flex-col">
        <StatRailCalendar compact showWeekSummary={false} showTodayDot homeFlat />
        <div className="mt-home-rail-section border-t border-divider pt-home-rail-section">
          <StreakStatCard variant="featured" flat />
        </div>
        <div className="mt-home-rail-section border-t border-divider pt-home-rail-section">
          <HomeOverviewCard flat />
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-6">
      <StatRailCalendar showWeekSummary={false} showTodayDot />
      <StreakStatCard variant="featured" />
      <HomeOverviewCard />
    </div>
  );
}
