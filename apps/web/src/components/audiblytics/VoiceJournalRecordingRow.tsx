'use client';

import { MoreVertical, Pause, Play } from 'lucide-react';

import { OfflineBadge } from '@/components/audiblytics/OfflineBadge';
import { RecordingWaveformPlaceholder } from '@/components/audiblytics/RecordingWaveformPlaceholder';
import type { RecordingWithTheme } from '@/features/voice-journal/use-recordings';
import { deriveRecordingRowLabels } from '@/lib/voice-journal/recording-row-labels';
import {
  formatDurationLabel,
  formatRecordingDateTime,
} from '@/lib/voice-journal/format-recording-display';
import { triggerRecordingDownload } from '@/lib/voice-journal/recording-download';
import { isWarmupRecordingParagraphId } from '@/lib/warmup-recording-id';
import { cn } from '@/lib/utils';

const RECORDING_UNAVAILABLE =
  'Recording unavailable — comparing against earliest available.';

export type VoiceJournalRecordingRowProps = {
  row: RecordingWithTheme;
  isPlaying: boolean;
  isCompareMode: boolean;
  isSelected: boolean;
  compareTone: 'neutral' | 'active' | 'dim';
  comparePhaseIdle: boolean;
  showCompareCheckbox: boolean;
  showUnavailable: boolean;
  showOfflineBadge: boolean;
  onTogglePlay: () => void;
  onToggleCompareSelection: () => void;
};

export function VoiceJournalRecordingRow({
  row,
  isPlaying,
  isCompareMode,
  isSelected,
  compareTone,
  comparePhaseIdle,
  showCompareCheckbox,
  showUnavailable,
  showOfflineBadge,
  onTogglePlay,
  onToggleCompareSelection,
}: VoiceJournalRecordingRowProps) {
  const isWarmup = isWarmupRecordingParagraphId(row.paragraphId);
  const labels = deriveRecordingRowLabels(row.durationMs);
  const title = isWarmup ? `Day ${row.dayOfUse}` : `Day ${row.dayOfUse} · ${row.themeLabel}`;

  return (
    <div
      className={cn(
        'rounded-lg border border-divider bg-surface-card px-4 py-4 transition-colors',
        isPlaying && 'ring-1 ring-primary/30',
        compareTone === 'active' && 'bg-surface-elevated',
        compareTone === 'dim' && 'opacity-60',
        isSelected && comparePhaseIdle && 'ring-2 ring-focus ring-offset-2 ring-offset-background',
      )}
    >
      <div className="flex items-start gap-3">
        {showCompareCheckbox ? (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleCompareSelection}
            className="mt-3 size-4 shrink-0 rounded border-divider text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
            aria-label={`Select recording for comparison, day ${row.dayOfUse}`}
          />
        ) : null}

        <button
          type="button"
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40"
          aria-label={isPlaying ? 'Pause recording' : 'Play recording'}
          disabled={isCompareMode}
          onClick={onTogglePlay}
        >
          {isPlaying ? (
            <Pause className="size-4" strokeWidth={1.6} aria-hidden />
          ) : (
            <Play className="ml-0.5 size-4" strokeWidth={1.6} aria-hidden />
          )}
        </button>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                {isWarmup ? (
                  <span className="rounded-sm border border-divider px-1.5 py-0.5 text-caption text-secondary">
                    Warm-up
                  </span>
                ) : null}
                <p className="text-ui font-semibold text-foreground">{title}</p>
                {showOfflineBadge ? <OfflineBadge /> : null}
              </div>
              <p className="text-caption text-secondary">
                {formatRecordingDateTime(row.recordingDate)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-caption text-secondary">{formatDurationLabel(row.durationMs)}</span>
              <button
                type="button"
                className="inline-flex size-8 items-center justify-center rounded-md text-tertiary transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
                aria-label="Download recording"
                onClick={() => triggerRecordingDownload(row)}
              >
                <MoreVertical className="size-4" strokeWidth={1.6} aria-hidden />
                <span className="sr-only">Download</span>
              </button>
            </div>
          </div>

          <RecordingWaveformPlaceholder seed={row.id} barCount={28} />

          <dl className="flex flex-wrap gap-x-4 gap-y-1 text-caption">
            <div>
              <dt className="text-tertiary">Clarity</dt>
              <dd className="font-medium text-foreground">{labels.clarity}</dd>
            </div>
            <div>
              <dt className="text-tertiary">Pace</dt>
              <dd className="font-medium text-foreground">{labels.pace}</dd>
            </div>
            <div>
              <dt className="text-tertiary">Pauses</dt>
              <dd className="font-medium text-foreground">{labels.pauses}</dd>
            </div>
          </dl>

          {showUnavailable ? (
            <p className="text-caption text-secondary">{RECORDING_UNAVAILABLE}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
