'use client';

import { HomeDashboard } from '@/components/audiblytics/HomeDashboard';
import { AppGate } from '@/components/audiblytics/AppGate';

export default function HomePage() {
  return (
    <AppGate>
      <HomeDashboard />
    </AppGate>
  );
}
