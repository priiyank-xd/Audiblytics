'use client';

import { useMemo } from 'react';

import { VoiceJournalList } from '@/components/audiblytics/VoiceJournalList';
import type { ArchivedDaySnapshot } from '@/features/calendar/use-archived-day';
import { personaKeyToLabel } from '@/lib/ui/persona-key-label';
import { themeKeyToLabel } from '@/lib/ui/theme-key-label';

export type ArchivedDayPanelProps = {
  utcDate: string;
  data: ArchivedDaySnapshot;
};

function formatUtcHeading(utcYmd: string): string {
  const [y, mo, d] = utcYmd.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(y, mo - 1, d)));
}

export function ArchivedDayPanel({ utcDate, data }: ArchivedDayPanelProps) {
  const headingId = 'archived-day-heading';
  const title = useMemo(() => formatUtcHeading(utcDate), [utcDate]);
  const themeLabel = data.cached ? themeKeyToLabel(data.cached.theme) : null;
  const personaLabel = data.cached ? personaKeyToLabel(data.cached.persona) : null;

  return (
    <section
      aria-labelledby={headingId}
      className="mt-10 border-divider border-t pt-8"
    >
      <h2 id={headingId} className="text-headline-3 text-primary">
        {title}
      </h2>

      {themeLabel && personaLabel ? (
        <p className="mt-2 text-caption text-secondary">
          {themeLabel} · {personaLabel}
        </p>
      ) : null}

      {data.excerpt ? (
        <p className="mt-4 font-serif text-body text-primary">{data.excerpt}</p>
      ) : (
        <p className="mt-4 text-caption text-tertiary">No paragraph excerpt stored for this day.</p>
      )}

      <p className="mt-4 text-caption text-secondary">
        Words saved this day: <span className="tabular-nums text-foreground">{data.savedWordsCount}</span>
      </p>

      <div className="mt-6">
        <h3 className="text-ui-sm font-medium uppercase tracking-wide text-tertiary">Recordings</h3>
        {data.recordings.length > 0 ? (
          <VoiceJournalList recordings={data.recordings} className="mt-3" hideCompare />
        ) : (
          <p className="mt-2 text-caption text-tertiary">No recordings for this day.</p>
        )}
      </div>
    </section>
  );
}
