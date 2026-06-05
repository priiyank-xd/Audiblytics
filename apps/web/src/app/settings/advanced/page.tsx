import { Suspense } from 'react';

import { SettingsAdvancedPage } from '@/features/settings/settings-advanced-page';

function AdvancedFallback() {
  return <p className="text-body text-secondary">Loading…</p>;
}

export default function SettingsAdvancedRoute() {
  return (
    <Suspense fallback={<AdvancedFallback />}>
      <SettingsAdvancedPage />
    </Suspense>
  );
}
