import { Suspense } from 'react';

import { JourneyPageClient } from '@/features/journey/journey-page-client';

function JourneyFallback() {
  return (
    <div className="min-h-32 space-y-3 py-6" aria-busy="true">
      <div className="h-8 max-w-xs rounded-md bg-cream-dim" />
      <div className="h-24 w-full rounded-lg bg-cream-dim" />
    </div>
  );
}

export default function JourneyPage() {
  return (
    <Suspense fallback={<JourneyFallback />}>
      <JourneyPageClient />
    </Suspense>
  );
}
