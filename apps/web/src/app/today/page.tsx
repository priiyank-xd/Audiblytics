'use client';

import { AppGate } from '@/components/audiblytics/AppGate';
import { TodayApp } from '@/features/today/today-app';

export default function TodayPage() {
  return (
    <AppGate>
      <TodayApp />
    </AppGate>
  );
}
