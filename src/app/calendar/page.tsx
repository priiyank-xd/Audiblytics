import { Suspense } from 'react';

import { CalendarPageClient } from '@/app/calendar/calendar-page-client';

export default function CalendarPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-32 space-y-3 py-6" aria-busy="true">
          <div className="h-8 max-w-xs rounded-md bg-muted" />
          <div className="h-24 w-full rounded-xl bg-muted" />
        </div>
      }
    >
      <CalendarPageClient />
    </Suspense>
  );
}
