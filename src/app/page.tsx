'use client';

import { HomeDashboard } from '@/components/audiblytics/HomeDashboard';
import { ProviderKeysGate } from '@/components/audiblytics/ProviderKeysGate';

export default function HomePage() {
  return (
    <ProviderKeysGate>
      <HomeDashboard />
    </ProviderKeysGate>
  );
}
