'use client';

import { StreakStatCard } from '@/components/audiblytics/StreakStatCard';
import { StatRailCalendar } from '@/components/audiblytics/StatRailCalendar';
import { MonthlyProgressCard, TodaysFocusCard } from '@/components/audiblytics/StatRailHomeWidgets';

export type StatRailHomeProps = {
  compact?: boolean;
};

export function StatRailHome({ compact = false }: StatRailHomeProps) {
  if (compact) {
    return (
      <div className="grid min-h-0 w-full grid-home-rail-rows gap-home-rail">
        <StatRailCalendar compact showWeekSummary={false} showTodayDot homeCard />
        <StreakStatCard variant="featured" compact />
        <TodaysFocusCard compact />
        <MonthlyProgressCard compact />
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-6">
      <StatRailCalendar showWeekSummary={false} showTodayDot />
      <StreakStatCard variant="featured" />
      <TodaysFocusCard />
      <MonthlyProgressCard />
    </div>
  );
}
