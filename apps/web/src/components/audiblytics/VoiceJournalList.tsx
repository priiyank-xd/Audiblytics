'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Download, Pause, Play } from 'lucide-react';

import { CompositePlayer, type CompareModePhase } from '@/components/audiblytics/CompositePlayer';
import { OfflineBadge } from '@/components/audiblytics/OfflineBadge';
import { Button } from '@/components/ui/button';
import { fetchRecordingPlaybackUrl } from '@/lib/api/recordings';
import { playRecordingItem } from '@/lib/audio/play-recording';
import { useCompareRecordings } from '@/features/voice-journal/use-compare-recordings';
import type { RecordingWithTheme } from '@/features/voice-journal/use-recordings';
import { formatUtcDate } from '@/lib/day-counter/format-utc-date';
import { useCompletions } from '@/features/calendar/use-completions';
import { useLocalStorage } from '@/lib/storage/use-local-storage';
import { cn } from '@/lib/utils';
import { isWarmupRecordingParagraphId } from '@/lib/warmup-recording-id';

const RECORDING_UNAVAILABLE =
  'Recording unavailable — comparing against earliest available.';

function formatDurationLabel(ms: number): string {
  const totalSec = Math.round(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function downloadExtension(mimeType: string): 'webm' | 'mp4' {
  const m = mimeType.toLowerCase();
  if (m.includes('mp4')) return 'mp4';
  return 'webm';
}

function localHhmm(isoUtc: string): string {
  const d = new Date(isoUtc);
  const h = d.getHours();
  const min = d.getMinutes();
  return `${String(h).padStart(2, '0')}${String(min).padStart(2, '0')}`;
}

function triggerDownload(row: RecordingWithTheme): void {
  if (!row.blob) return;
  const ext = downloadExtension(row.mimeType);
  const hhmm = localHhmm(row.recordingDate);
  const filename = `audiblytics-day-${row.dayOfUse}-${hhmm}.${ext}`;
  const url = URL.createObjectURL(new Blob([row.blob], { type: row.mimeType }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export type VoiceJournalListProps = {
  recordings: RecordingWithTheme[];
  className?: string;
  /** When true, hides compare controls (e.g. embedded archived-day list). */
  hideCompare?: boolean;
};

type RowCompareTone = 'neutral' | 'active' | 'dim';

export function VoiceJournalList({ recordings, className, hideCompare }: VoiceJournalListProps) {
  const completions = useCompletions() ?? {};
  const compare = useCompareRecordings(recordings);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [comparePhase, setComparePhase] = useState<CompareModePhase>('idle');
  const [compareUnavailableIds, setCompareUnavailableIds] = useState<Set<string>>(() => new Set());

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const revokeObjectUrlRef = useRef(false);

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
    if (compare.isCompareMode) {
      stopPlayback();
    }
  }, [compare.isCompareMode, stopPlayback]);

  useEffect(() => {
    if (!compare.isCompareMode) {
      setComparePhase('idle');
      setCompareUnavailableIds(new Set());
    }
  }, [compare.isCompareMode]);

  const handleClipUnavailable = useCallback((recordingId: string) => {
    setCompareUnavailableIds((prev) => new Set(prev).add(recordingId));
  }, []);

  const handleComparisonSequenceStart = useCallback(() => {
    setCompareUnavailableIds(new Set());
  }, []);

  const togglePlay = useCallback(
    (row: RecordingWithTheme) => {
      if (compare.isCompareMode) return;
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
    [compare.isCompareMode, playingId, stopPlayback],
  );

  const rowCompareTone = useCallback(
    (rowId: string): RowCompareTone => {
      if (!compare.isCompareMode) return 'neutral';
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
    [compare.isCompareMode, compare.selectedIdA, compare.selectedIdB, comparePhase],
  );

  return (
    <div className={cn('space-y-4', className)}>
      {!hideCompare ? (
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="outline" size="sm" onClick={compare.toggleCompareMode}>
            {compare.isCompareMode ? 'Cancel compare' : 'Compare'}
          </Button>
          {compare.isCompareMode ? (
            <p className="text-caption text-secondary">
              Select two recordings. A third pick replaces the oldest selection.
            </p>
          ) : null}
        </div>
      ) : null}

      {!hideCompare && compare.isCompareMode && compare.canPlayComparison && compare.compareSources ? (
        <CompositePlayer
          mode="compare"
          sourceA={compare.compareSources.sourceA}
          sourceB={compare.compareSources.sourceB}
          onPhaseChange={setComparePhase}
          onClipUnavailable={handleClipUnavailable}
          onComparisonSequenceStart={handleComparisonSequenceStart}
        />
      ) : null}

      <audio ref={audioRef} className="hidden" onEnded={() => stopPlayback()} />
      <ul className="space-y-1" aria-label="Voice recordings">
        {recordings.map((row) => {
          const isWarmup = isWarmupRecordingParagraphId(row.paragraphId);
          const isPlaying = playingId === row.id && !compare.isCompareMode;
          const tone = hideCompare ? 'neutral' : rowCompareTone(row.id);
          const isSelected =
            !hideCompare &&
            compare.isCompareMode &&
            (row.id === compare.selectedIdA || row.id === compare.selectedIdB);
          const showUnavailable = compareUnavailableIds.has(row.id);
          const recordingUtcDate = formatUtcDate(new Date(row.recordingDate));
          const showOfflineBadge = completions[recordingUtcDate]?.usedOfflinePack === true;

          return (
            <li key={row.id}>
              <div
                className={cn(
                  'flex items-start gap-3 rounded-md px-2 py-3 transition-colors',
                  isPlaying && 'bg-cream-dim',
                  tone === 'active' && 'bg-cream-dim',
                  tone === 'dim' && 'opacity-60',
                  isSelected &&
                    comparePhase === 'idle' &&
                    'ring-1 ring-focus ring-offset-2 ring-offset-background',
                )}
              >
                {!hideCompare && compare.isCompareMode ? (
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => compare.toggleRowSelection(row.id)}
                    className="mt-2 size-4 shrink-0 rounded border-divider text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
                    aria-label={`Select recording for comparison, day ${row.dayOfUse}`}
                  />
                ) : null}
                <button
                  type="button"
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-tertiary transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40"
                  aria-label={isPlaying ? 'Pause recording' : 'Play recording'}
                  disabled={compare.isCompareMode}
                  onClick={() => togglePlay(row)}
                >
                  {isPlaying ? (
                    <Pause className="size-5" strokeWidth={1.5} aria-hidden />
                  ) : (
                    <Play className="size-5" strokeWidth={1.5} aria-hidden />
                  )}
                </button>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-caption text-primary">
                    {isWarmup ? (
                      <>
                        <span className="rounded-sm border border-divider px-1.5 py-0.5 text-caption text-secondary">
                          Warm-up
                        </span>
                        <span>Day {row.dayOfUse} · {formatDurationLabel(row.durationMs)}</span>
                      </>
                    ) : (
                      <span>
                        Day {row.dayOfUse} · {row.themeLabel} · {formatDurationLabel(row.durationMs)}
                      </span>
                    )}
                    {showOfflineBadge ? <OfflineBadge /> : null}
                  </p>
                  {showUnavailable ? (
                    <p className="text-caption text-secondary">{RECORDING_UNAVAILABLE}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-tertiary transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
                  aria-label="Download recording"
                  onClick={() => triggerDownload(row)}
                >
                  <Download className="size-5" strokeWidth={1.5} aria-hidden />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
