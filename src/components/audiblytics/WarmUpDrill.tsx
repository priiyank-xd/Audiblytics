'use client';

import type { RefObject } from 'react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { pickRandomPhrase } from '@/features/warm-up/drill-library';
import { useWarmUpRecording } from '@/features/warm-up/use-warm-up-recording';
import { useWarmUpStateMachine } from '@/features/warm-up/use-warm-up-state-machine';
import { InlineErrorSurface } from '@/components/audiblytics/InlineErrorSurface';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const BACK_LABEL = "Back to today's paragraph";

const MIC_DENIED_COPY =
  'Microphone access is required to record. Click the lock icon in your address bar, then try again.';

export type WarmUpDrillProps = {
  onExitToToday: () => void;
  onOpenSettings: () => void;
  /** When set, expansion animation uses this element as the visual origin. */
  anchorRef?: RefObject<HTMLElement | null>;
  className?: string;
};

const ANNOUNCE_BOUNDARIES_SEC = [10, 20, 30] as const;

export function WarmUpDrill({ onExitToToday, onOpenSettings, anchorRef, className }: WarmUpDrillProps) {
  const phrase = useMemo(() => pickRandomPhrase(), []);
  const flushRef = useRef<() => Promise<void>>(async () => {});
  const panelRef = useRef<HTMLDivElement>(null);
  const [transformOrigin, setTransformOrigin] = useState<string>('top left');

  const { phase, withPenMs, withoutPenMs, formattedTimer } = useWarmUpStateMachine({
    onFinished: () => {
      void flushRef.current().then(() => onExitToToday());
    },
  });

  const recording = useWarmUpRecording({ phase, phrase });

  useLayoutEffect(() => {
    flushRef.current = recording.flushIfNeeded;
  }, [recording.flushIfNeeded]);

  useLayoutEffect(() => {
    const setFromAnchor = () => {
      const panel = panelRef.current;
      const anchor = anchorRef?.current;
      if (!panel) return;
      if (!anchor) {
        setTransformOrigin('top left');
        return;
      }
      const br = anchor.getBoundingClientRect();
      const pr = panel.getBoundingClientRect();
      const x = br.left + br.width / 2 - pr.left;
      const y = br.top + br.height / 2 - pr.top;
      setTransformOrigin(`${Math.max(0, x)}px ${Math.max(0, y)}px`);
    };
    setFromAnchor();
    window.addEventListener('resize', setFromAnchor);
    return () => window.removeEventListener('resize', setFromAnchor);
  }, [anchorRef]);

  const [liveCue, setLiveCue] = useState('');
  const announcedPenRef = useRef(new Set<number>());
  const announcedNoPenRef = useRef(new Set<number>());

  const handleExit = useCallback(() => {
    void flushRef.current().then(() => onExitToToday());
  }, [onExitToToday]);

  useEffect(() => {
    if (phase === 'transition') return;

    const elapsedMs = phase === 'with_pen' ? withPenMs : withoutPenMs;
    const elapsedSec = Math.min(30, Math.floor(elapsedMs / 1000));
    const bucket = phase === 'with_pen' ? announcedPenRef : announcedNoPenRef;
    const passLabel = phase === 'with_pen' ? 'With pen' : 'Without pen';

    for (const b of ANNOUNCE_BOUNDARIES_SEC) {
      if (elapsedSec >= b && !bucket.current.has(b)) {
        bucket.current.add(b);
        setLiveCue(`${passLabel} timer: 0:${String(b).padStart(2, '0')}`);
      }
    }
  }, [phase, withPenMs, withoutPenMs]);

  const instruction =
    phase === 'with_pen'
      ? 'Hold a pen between your teeth. Read this out loud:'
      : 'Now without the pen, read it again.';

  const recordLabel = recording.isRecording ? 'Stop recording this pass' : '● Record this pass';

  return (
    <div
      ref={panelRef}
      role="region"
      aria-label="Pen-drill warm-up, 30 seconds"
      style={{ transformOrigin }}
      className={cn(
        'mt-6 mb-10 rounded-sm border border-divider bg-surface-elevated p-6 shadow-sm',
        'outline-none focus-within:ring-2 focus-within:ring-focus focus-within:ring-offset-2 focus-within:ring-offset-background',
        'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:duration-300 motion-safe:ease-out',
        className,
      )}
    >
      <p className="text-body text-secondary">{instruction}</p>
      <p className="mt-4 font-serif text-paragraph-hero text-primary">{phrase}</p>

      <p
        className="mt-6 font-mono text-headline-3 text-primary tabular-nums"
        aria-live="off"
      >
        {formattedTimer}
      </p>

      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {liveCue}
      </div>

      {phase !== 'transition' ? (
        <div className="mt-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-caption text-secondary"
            aria-pressed={recording.isRecording}
            aria-label={recordLabel}
            disabled={recording.recordDisabled}
            onClick={() => void recording.toggleRecordThisPass()}
          >
            {recordLabel}
          </Button>
        </div>
      ) : null}

      {recording.micError && recording.micError.kind === 'permission_denied' ? (
        <div className="mt-4 space-y-3" role="status">
          <p className="text-body text-secondary">{MIC_DENIED_COPY}</p>
          <Button type="button" variant="outline" size="sm" onClick={recording.handleTryMicAgain}>
            Try Again
          </Button>
        </div>
      ) : recording.micError ? (
        <div className="mt-4 space-y-3" role="status">
          <p className="text-body text-secondary">{recording.micError.message}</p>
          <Button type="button" variant="outline" size="sm" onClick={recording.handleTryMicAgain}>
            Try Again
          </Button>
        </div>
      ) : null}

      {recording.storageError && recording.pendingSave ? (
        <div className="mt-4">
          <InlineErrorSurface
            variant="storage"
            error={recording.storageError}
            isRetrying={recording.saveRetrying}
            onRetry={() => void recording.handleRetrySave()}
            onOpenSettings={onOpenSettings}
          />
        </div>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-3">
        <Button type="button" variant="outline" size="sm" onClick={handleExit}>
          {BACK_LABEL}
        </Button>
      </div>
    </div>
  );
}
