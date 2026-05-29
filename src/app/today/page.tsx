'use client';

import { ProviderKeysGate } from '@/components/audiblytics/ProviderKeysGate';
import { TodayApp } from '@/features/today/today-app';

export default function TodayPage() {
  return (
    <ProviderKeysGate>
      <TodayApp />
    </ProviderKeysGate>
  );
}
