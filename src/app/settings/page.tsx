import { Suspense } from 'react';

import { SettingsForm } from '@/features/settings/settings-form';

function SettingsFallback() {
  return <p className="text-body text-secondary">Loading settings…</p>;
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsFallback />}>
      <SettingsForm />
    </Suspense>
  );
}
