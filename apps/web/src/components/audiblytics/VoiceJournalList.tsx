'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { VoiceJournalRecordingRow } from '@/components/audiblytics/VoiceJournalRecordingRow';
import type { CompareModePhase } from '@/components/audiblytics/CompositePlayer';
import { fetchRecordingPlaybackUrl } from '@/lib/api/recordings';
import { playRecordingItem } from '@/lib/audio/play-recording';
import type { UseCompareRecordingsResult } from '@/features/voice-journal/use-compare-recordings';
import type { RecordingWithTheme } from '@/features/voice-journal/use-recordings';
import { formatUtcDate } from '@/lib/day-counter/format-utc-date';
import { useCompletions } from '@/features/calendar/use-completions';
import { cn } from '@/lib/utils';

export type VoiceJournalListProps = {
  recordings: RecordingWithTheme[];
  className?: string;
  /** When true, hides compare checkboxes (e.g. embedded archived-day list). */
  hideCompare?: boolean;
  /** Provided by page when compare UI lives in the right rail. */
  compare?: UseCompareRecordingsResult;
  comparePhase?: CompareModePhase;
  compareUnavailableIds?: ReadonlySet<string>;
};

type RowCompareTone = 'neutral' | 'active' | 'dim';

export function VoiceJournalList({
  recordings,
  className,
  hideCompare = false,
  compare,
  comparePhase = 'idle',
  compareUnavailableIds,
}: VoiceJournalListProps) {
  const completions = useCompletions() ?? {};
  const [playingId, setPlayingId] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const revokeObjectUrlRef = useRef(false);

  const isCompareMode = !hideCompare && (compare?.isCompareMode ?? false);

  const stopPlayback = useCallback(() => {
    const a = audioRef.current;
    if (a) {
      a.pause();
      a.removeAttribute('src');
      a.load();
    }
    if (objectUrlRef.current && revokeObjectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }
    objectUrlRef.current = null;
    revokeObjectUrlRef.current = false;
    setPlayingId(null);
  }, []);

  useEffect(() => () => stopPlayback(), [stopPlayback]);

  useEffect(() => {
    if (isCompareMode) {
      stopPlayback();
    }
  }, [isCompareMode, stopPlayback]);

  const togglePlay = useCallback(
    (row: RecordingWithTheme) => {
      if (isCompareMode) return;
      if (playingId === row.id) {
        stopPlayback();
        return;
      }
      stopPlayback();
      const a = audioRef.current;
      if (!a) return;
      void (async () => {
        try {
          const handle = await playRecordingItem(a, row, fetchRecordingPlaybackUrl);
          if (handle.kind === 'blob') {
            objectUrlRef.current = handle.url;
            revokeObjectUrlRef.current = true;
          } else {
            objectUrlRef.current = handle.url;
            revokeObjectUrlRef.current = false;
          }
          setPlayingId(row.id);
        } catch (e) {
          console.warn('[VoiceJournalList] playback failed', e);
          stopPlayback();
        }
      })();
    },
    [isCompareMode, playingId, stopPlayback],
  );

  const rowCompareTone = useCallback(
    (rowId: string): RowCompareTone => {
      if (!isCompareMode || !compare) return 'neutral';
      const aId = compare.selectedIdA;
      const bId = compare.selectedIdB;
      if (!aId || !bId) return 'neutral';
      if (rowId !== aId && rowId !== bId) return 'neutral';

      if (comparePhase === 'playing_a') {
        if (rowId === aId) return 'active';
        if (rowId === bId) return 'dim';
      }
      if (comparePhase === 'gap') {
        if (rowId === aId) return 'active';
        if (rowId === bId) return 'dim';
      }
      if (comparePhase === 'playing_b') {
        if (rowId === bId) return 'active';
        if (rowId === aId) return 'dim';
      }
      return 'neutral';
    },
    [compare, comparePhase, isCompareMode],
  );

  return (
    <div className={cn('space-y-4', className)}>
      <audio ref={audioRef} className="hidden" onEnded={() => stopPlayback()} />
      <ul className="space-y-3" aria-label="Voice recordings">
        {recordings.map((row) => {
          const isPlaying = playingId === row.id && !isCompareMode;
          const tone = hideCompare ? 'neutral' : rowCompareTone(row.id);
          const isSelected =
            !hideCompare &&
            isCompareMode &&
            compare !== undefined &&
            (row.id === compare.selectedIdA || row.id === compare.selectedIdB);
          const showUnavailable = compareUnavailableIds?.has(row.id) ?? false;
          const recordingUtcDate = formatUtcDate(new Date(row.recordingDate));
          const showOfflineBadge = completions[recordingUtcDate]?.usedOfflinePack === true;

          return (
            <li key={row.id}>
              <VoiceJournalRecordingRow
                row={row}
                isPlaying={isPlaying}
                isCompareMode={isCompareMode}
                isSelected={isSelected}
                compareTone={tone}
                comparePhaseIdle={comparePhase === 'idle'}
                showCompareCheckbox={isCompareMode}
                showUnavailable={showUnavailable}
                showOfflineBadge={showOfflineBadge}
                onTogglePlay={() => togglePlay(row)}
                onToggleCompareSelection={() => compare?.toggleRowSelection(row.id)}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
