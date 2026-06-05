'use client';

import { CompositePlayer, type CompareModePhase } from '@/components/audiblytics/CompositePlayer';
import { Button } from '@/components/ui/button';
import type { UseCompareRecordingsResult } from '@/features/voice-journal/use-compare-recordings';
import type { RecordingWithTheme } from '@/features/voice-journal/use-recordings';
import { cn } from '@/lib/utils';

export type VoiceJournalCompareCardProps = {
  recordings: RecordingWithTheme[];
  compare: UseCompareRecordingsResult;
  comparePhase: CompareModePhase;
  onComparePhaseChange: (phase: CompareModePhase) => void;
  onClipUnavailable: (recordingId: string) => void;
  onComparisonSequenceStart: () => void;
  className?: string;
};

function dayLabel(recordings: RecordingWithTheme[], id: string | null): string {
  if (!id) return '—';
  const row = recordings.find((r) => r.id === id);
  return row ? `Day ${row.dayOfUse}` : '—';
}

export function VoiceJournalCompareCard({
  recordings,
  compare,
  comparePhase,
  onComparePhaseChange,
  onClipUnavailable,
  onComparisonSequenceStart,
  className,
}: VoiceJournalCompareCardProps) {
  return (
    <section
      className={cn(
        'rounded-lg border border-divider bg-surface-card px-5 py-5',
        className,
      )}
      aria-label="Compare sessions"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-ui font-semibold text-foreground">Compare sessions</h2>
          <p className="mt-1 text-caption text-secondary">
            Pick two recordings to hear them back-to-back.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={compare.toggleCompareMode}>
          {compare.isCompareMode ? 'Cancel compare' : 'Compare'}
        </Button>
      </div>

      {compare.isCompareMode ? (
        <p className="mt-3 text-caption text-secondary">
          Select two recordings in the list. A third pick replaces the oldest selection.
        </p>
      ) : null}

      {compare.isCompareMode && (compare.selectedIdA || compare.selectedIdB) ? (
        <div className="mt-4 flex flex-wrap gap-4 text-caption">
          <p>
            <span className="text-tertiary">A: </span>
            <span className="font-medium text-foreground">
              {dayLabel(recordings, compare.selectedIdA)}
            </span>
          </p>
          <p>
            <span className="text-tertiary">B: </span>
            <span className="font-medium text-foreground">
              {dayLabel(recordings, compare.selectedIdB)}
            </span>
          </p>
        </div>
      ) : null}

      {compare.isCompareMode && compare.canPlayComparison && compare.compareSources ? (
        <div className="mt-4 border-t border-divider pt-4">
          <CompositePlayer
            mode="compare"
            sourceA={compare.compareSources.sourceA}
            sourceB={compare.compareSources.sourceB}
            onPhaseChange={onComparePhaseChange}
            onClipUnavailable={onClipUnavailable}
            onComparisonSequenceStart={onComparisonSequenceStart}
          />
        </div>
      ) : null}
    </section>
  );
}
