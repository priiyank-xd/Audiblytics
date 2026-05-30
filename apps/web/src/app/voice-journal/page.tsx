'use client';

import { FeatureRouteShell } from '@/components/audiblytics/FeatureRouteShell';
import { VoiceJournalList } from '@/components/audiblytics/VoiceJournalList';
import { useRecordings } from '@/features/voice-journal/use-recordings';

export default function VoiceJournalPage() {
  const recordings = useRecordings();

  return (
    <FeatureRouteShell>
      {recordings === undefined ? (
        <div className="space-y-3" aria-busy="true">
          <div className="h-5 max-w-[12rem] rounded-sm bg-cream-dim" />
          <div className="h-5 max-w-[20rem] rounded-sm bg-cream-dim" />
          <div className="h-5 max-w-[16rem] rounded-sm bg-cream-dim" />
          <p className="text-caption text-primary">Loading…</p>
        </div>
      ) : recordings.length === 0 ? (
        <p className="font-serif text-body text-primary italic">No recordings yet.</p>
      ) : (
        <section className="space-y-6">
          <header className="space-y-1 border-divider border-b pb-4">
            <h1 className="text-headline-2 text-primary">Voice journal</h1>
            <p className="text-caption text-secondary">Every take, newest first.</p>
          </header>
          <VoiceJournalList recordings={recordings} />
        </section>
      )}
    </FeatureRouteShell>
  );
}
