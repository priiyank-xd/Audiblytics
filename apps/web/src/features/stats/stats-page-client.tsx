'use client';

import Link from 'next/link';

import { FeatureRouteShell } from '@/components/audiblytics/FeatureRouteShell';
import { JourneyStatsRow } from '@/features/journey/journey-stats-row';

export function StatsPageClient() {
  return (
    <FeatureRouteShell>
      <div className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-2">
          <h1 className="text-headline-2 text-primary">Stats</h1>
          <p className="text-body text-primary">
            Practice metrics from your log only — no fabricated targets.
          </p>
        </header>

        <JourneyStatsRow ariaLabel="Practice statistics" />

        <p>
          <Link
            href="/journey"
            className="text-ui-sm text-primary underline underline-offset-4 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
          >
            Open Journey for calendar and session history
          </Link>
        </p>
      </div>
    </FeatureRouteShell>
  );
}
