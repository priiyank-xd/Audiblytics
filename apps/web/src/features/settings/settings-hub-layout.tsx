'use client';

import type { ReactNode } from 'react';

import { FeatureRouteShell } from '@/components/audiblytics/FeatureRouteShell';
import { SettingsSubNav } from '@/components/audiblytics/SettingsSubNav';
import { SettingsHubProvider, useSettingsHub } from '@/features/settings/settings-hub-context';

function SettingsHubChrome({ children }: { children: ReactNode }) {
  const { apiSettingsLoading } = useSettingsHub();

  return (
    <FeatureRouteShell>
      {apiSettingsLoading ? (
        <p className="text-body text-secondary">Loading settings from API…</p>
      ) : null}

      <header className="space-y-1">
        <h1 className="text-headline-2 text-primary">Settings</h1>
        <p className="text-body text-primary">
          Changes apply on your next paragraph generation.
        </p>
      </header>

      <div className="flex flex-col gap-8 pt-4 lg:flex-row lg:gap-10">
        <div className="lg:w-52 lg:shrink-0">
          <SettingsSubNav showLabels className="lg:sticky lg:top-8" />
        </div>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </FeatureRouteShell>
  );
}

export function SettingsHubLayout({ children }: { children: ReactNode }) {
  return (
    <SettingsHubProvider>
      <SettingsHubChrome>{children}</SettingsHubChrome>
    </SettingsHubProvider>
  );
}
