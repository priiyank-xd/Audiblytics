'use client';

import { useCallback, useEffect, useState } from 'react';

import { FeatureRouteShell } from '@/components/audiblytics/FeatureRouteShell';
import type { CompareModePhase } from '@/components/audiblytics/CompositePlayer';
import { VoiceJournalAiReflectionCard } from '@/components/audiblytics/VoiceJournalAiReflectionCard';
import { VoiceJournalCompareCard } from '@/components/audiblytics/VoiceJournalCompareCard';
import { VoiceJournalList } from '@/components/audiblytics/VoiceJournalList';
import { VoiceJournalNotesCard } from '@/components/audiblytics/VoiceJournalNotesCard';
import { isStretchUiEnabled } from '@/lib/config/stretch-ui';
import { useCompareRecordings } from '@/features/voice-journal/use-compare-recordings';
import { useRecordings } from '@/features/voice-journal/use-recordings';

export default function VoiceJournalPage() {
  const recordings = useRecordings();
  const compare = useCompareRecordings(recordings ?? []);
  const [comparePhase, setComparePhase] = useState<CompareModePhase>('idle');
  const [compareUnavailableIds, setCompareUnavailableIds] = useState<Set<string>>(
    () => new Set(),
  );

  const handleClipUnavailable = useCallback((recordingId: string) => {
    setCompareUnavailableIds((prev) => new Set(prev).add(recordingId));
  }, []);

  const handleComparisonSequenceStart = useCallback(() => {
    setCompareUnavailableIds(new Set());
  }, []);

  useEffect(() => {
    if (!compare.isCompareMode) {
      setComparePhase('idle');
      setCompareUnavailableIds(new Set());
    }
  }, [compare.isCompareMode]);

  return (
    <FeatureRouteShell>
      {recordings === undefined ? (
        <div className="space-y-3" aria-busy="true">
          <div className="h-8 max-w-[16rem] rounded-sm bg-cream-dim" />
          <div className="h-5 max-w-[24rem] rounded-sm bg-cream-dim" />
          <div className="h-32 rounded-lg bg-cream-dim" />
          <div className="h-32 rounded-lg bg-cream-dim" />
          <p className="text-caption text-primary">Loading…</p>
        </div>
      ) : recordings.length === 0 ? (
        <header className="space-y-1">
          <h1 className="text-headline-2 text-primary">Voice Journal</h1>
          <p className="text-caption text-secondary">Your recordings. Your progress.</p>
          <p className="pt-6 font-serif text-body text-primary italic">No recordings yet.</p>
        </header>
      ) : (
        <div className="space-y-8">
          <header className="space-y-1 border-divider border-b pb-4">
            <h1 className="text-headline-2 text-primary">Voice Journal</h1>
            <p className="text-caption text-secondary">Your recordings. Your progress.</p>
          </header>

          <div className="grid min-w-0 grid-cols-1 items-start gap-8 xl:grid-cols-[minmax(0,1fr)_20rem]">
            <section className="min-w-0 space-y-4" aria-label="Your recordings">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-ui font-semibold text-foreground">Your recordings</h2>
                <span className="text-caption text-secondary">Newest first</span>
              </div>
              <VoiceJournalList
                recordings={recordings}
                compare={compare}
                comparePhase={comparePhase}
                compareUnavailableIds={compareUnavailableIds}
              />
            </section>

            <aside className="min-w-0 space-y-5 xl:sticky xl:top-6 xl:self-start">
              <VoiceJournalCompareCard
                recordings={recordings}
                compare={compare}
                comparePhase={comparePhase}
                onComparePhaseChange={setComparePhase}
                onClipUnavailable={handleClipUnavailable}
                onComparisonSequenceStart={handleComparisonSequenceStart}
              />
              {isStretchUiEnabled() ? <VoiceJournalAiReflectionCard /> : null}
              <VoiceJournalNotesCard />
            </aside>
          </div>
        </div>
      )}
    </FeatureRouteShell>
  );
}
