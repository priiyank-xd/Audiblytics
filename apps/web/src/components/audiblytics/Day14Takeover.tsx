'use client';

// WCAG 2.1.2 deliberate exception — see ux-design-specification.md §Named Exceptions

import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

import { ButtonPair, type Day14Choice } from '@/components/audiblytics/ButtonPair';
import { CompositePlayer, type CompareModePhase } from '@/components/audiblytics/CompositePlayer';
import { Button } from '@/components/ui/button';
import type { Day14RecordingPair } from '@/features/day14/select-day-1-recording';
import { selectDay1Recording } from '@/features/day14/select-day-1-recording';
import type { RecordingWithTheme } from '@/features/voice-journal/use-recordings';
import { formatUtcDate } from '@/lib/day-counter/format-utc-date';
import { isWarmupRecordingParagraphId } from '@/lib/warmup-recording-id';
import { cn } from '@/lib/utils';

const RECORDING_UNAVAILABLE =
  'Recording unavailable — comparing against earliest available.';

const OUTCOME_COPY: Record<Day14Choice, string> = {
  yes: "That's the entire reason this app exists. Keep going.",
  no: "Two weeks isn't always enough. Keep going.",
};

type TakeoverPhase = 'awaiting-decision' | 'outcome-yes' | 'outcome-no';

export type Day14TakeoverProps = {
  onCommitOutcome: (result: Day14Choice) => void;
  onDismiss: () => void;
};

function formatDurationLabel(ms: number): string {
  const totalSec = Math.round(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function toSource(row: RecordingWithTheme) {
  return {
    recordingId: row.id,
    blob: row.blob,
    mimeType: row.mimeType,
    ttsFallbackWord: row.ttsFallbackWord,
  };
}

function subscribeReducedMotion(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}

function getReducedMotionSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribeReducedMotion, getReducedMotionSnapshot, () => false);
}

function CompareRowPreview({
  row,
  tone,
  showUnavailable,
}: {
  row: RecordingWithTheme;
  tone: 'neutral' | 'active' | 'dim';
  showUnavailable: boolean;
}) {
  const isWarmup = isWarmupRecordingParagraphId(row.paragraphId);
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-md px-2 py-3 transition-colors',
        tone === 'active' && 'bg-cream-dim',
        tone === 'dim' && 'opacity-60',
      )}
    >
      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-mono text-caption text-primary">
          {isWarmup ? (
            <>
              <span className="mr-2 rounded-sm border border-divider px-1.5 py-0.5 text-caption text-secondary">
                Warm-up
              </span>
              Day {row.dayOfUse} · {formatDurationLabel(row.durationMs)}
            </>
          ) : (
            <>
              Day {row.dayOfUse} · {row.themeLabel} · {formatDurationLabel(row.durationMs)}
            </>
          )}
        </p>
        {showUnavailable ? (
          <p className="text-caption text-secondary">{RECORDING_UNAVAILABLE}</p>
        ) : null}
      </div>
    </div>
  );
}

export function Day14Takeover({ onCommitOutcome, onDismiss }: Day14TakeoverProps) {
  const router = useRouter();
  const [pair, setPair] = useState<Day14RecordingPair | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [comparePhase, setComparePhase] = useState<CompareModePhase>('idle');
  const [phase, setPhase] = useState<TakeoverPhase>('awaiting-decision');
  const [committing, setCommitting] = useState(false);
  const [{ playbackDone, fadeReady }, setTakeoverUi] = useState({
    playbackDone: false,
    fadeReady: false,
  });
  const [outcomeCopyVisible, setOutcomeCopyVisible] = useState(false);
  const [showGhostContinue, setShowGhostContinue] = useState(false);
  const [ghostFadeReady, setGhostFadeReady] = useState(false);
  const [unavailableIds, setUnavailableIds] = useState<Set<string>>(() => new Set());
  const prefersReducedMotion = usePrefersReducedMotion();
  const yesRef = useRef<HTMLButtonElement | null>(null);
  const ghostTimerRef = useRef<number | null>(null);

  const chosen: Day14Choice | null =
    phase === 'outcome-yes' ? 'yes' : phase === 'outcome-no' ? 'no' : null;

  const handlePlaybackComplete = useCallback(() => {
    const reduced = getReducedMotionSnapshot();
    if (reduced) {
      setTakeoverUi({ playbackDone: true, fadeReady: true });
      return;
    }
    setTakeoverUi({ playbackDone: true, fadeReady: false });
    requestAnimationFrame(() => {
      setTakeoverUi((s) => ({ ...s, fadeReady: true }));
    });
  }, []);

  useEffect(() => {
    void (async () => {
      const r = await selectDay1Recording();
      if (!r.ok) {
        setLoadFailed(true);
        return;
      }
      setPair(r.value);
    })();
  }, []);

  useEffect(() => {
    if (playbackDone && fadeReady) {
      yesRef.current?.focus();
    }
  }, [playbackDone, fadeReady]);

  useEffect(() => {
    return () => {
      if (ghostTimerRef.current !== null) {
        window.clearTimeout(ghostTimerRef.current);
      }
    };
  }, []);

  const startOutcomeFlow = useCallback(() => {
    setOutcomeCopyVisible(false);
    setShowGhostContinue(false);
    setGhostFadeReady(false);

    if (getReducedMotionSnapshot()) {
      setOutcomeCopyVisible(true);
    } else {
      requestAnimationFrame(() => setOutcomeCopyVisible(true));
    }

    if (ghostTimerRef.current !== null) {
      window.clearTimeout(ghostTimerRef.current);
    }
    ghostTimerRef.current = window.setTimeout(() => {
      setShowGhostContinue(true);
      if (getReducedMotionSnapshot()) {
        setGhostFadeReady(true);
      } else {
        requestAnimationFrame(() => setGhostFadeReady(true));
      }
    }, 3000);
  }, []);

  const handleCommit = useCallback(
    (result: Day14Choice) => {
      setCommitting(true);
      onCommitOutcome(result);
      setCommitting(false);
      setPhase(result === 'yes' ? 'outcome-yes' : 'outcome-no');
      startOutcomeFlow();
    },
    [onCommitOutcome, startOutcomeFlow],
  );

  const handleContinue = useCallback(() => {
    onDismiss();
    router.push('/');
  }, [onDismiss, router]);

  const handleClipUnavailable = useCallback((recordingId: string) => {
    setUnavailableIds((prev) => new Set(prev).add(recordingId));
  }, []);

  const handleComparisonSequenceStart = useCallback(() => {
    setUnavailableIds(new Set());
  }, []);

  const rowTone = useCallback(
    (rowId: string, aId: string, bId: string): 'neutral' | 'active' | 'dim' => {
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
    [comparePhase],
  );

  const utcToday = formatUtcDate(new Date());

  return (
    <DialogPrimitive.Root
      open
      defaultOpen
      modal
      disablePointerDismissal
      onOpenChange={(open, eventDetails) => {
        if (!open) eventDetails.cancel();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Popup
          className={cn(
            'fixed inset-0 z-50 flex max-h-[min(100dvh,100vh)] flex-col overflow-y-auto bg-surface px-4 py-10 outline-none',
          )}
          aria-labelledby="day14-headline"
        >
          <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center gap-8">
            <DialogPrimitive.Title
              id="day14-headline"
              render={<h1 className="text-balance text-center font-serif text-5xl text-foreground" />}
            >
              Listen to how far you&apos;ve come.
            </DialogPrimitive.Title>
            <p className="font-mono text-sm text-secondary">Day 14 · {utcToday}</p>

            {loadFailed ? (
              <p className="text-center text-body text-secondary">
                We couldn&apos;t load your recordings. You can continue using the app — this screen will
                clear after Day-14 flow is completed in a later update.
              </p>
            ) : null}

            {!pair && !loadFailed ? (
              <p className="text-caption text-secondary" aria-busy="true">
                Preparing comparison…
              </p>
            ) : null}

            {pair ? (
              <div className="flex w-full flex-col gap-6">
                <ul className="space-y-1" aria-label="Comparison clips">
                  <li>
                    <CompareRowPreview
                      row={pair.rowA}
                      tone={rowTone(pair.rowA.id, pair.rowA.id, pair.rowB.id)}
                      showUnavailable={unavailableIds.has(pair.rowA.id)}
                    />
                  </li>
                  <li>
                    <CompareRowPreview
                      row={pair.rowB}
                      tone={rowTone(pair.rowB.id, pair.rowA.id, pair.rowB.id)}
                      showUnavailable={unavailableIds.has(pair.rowB.id)}
                    />
                  </li>
                </ul>

                {phase === 'awaiting-decision' ? (
                  <CompositePlayer
                    mode="compare"
                    className="border-0 bg-transparent p-0"
                    playLabel={<>▶ Play comparison</>}
                    sourceA={toSource(pair.rowA)}
                    sourceB={toSource(pair.rowB)}
                    onPhaseChange={setComparePhase}
                    onClipUnavailable={handleClipUnavailable}
                    onComparisonSequenceStart={handleComparisonSequenceStart}
                    onPlaybackComplete={handlePlaybackComplete}
                  />
                ) : null}

                {chosen ? (
                  <p
                    aria-live="polite"
                    className={cn(
                      'text-center font-serif text-base text-ink-soft italic',
                      outcomeCopyVisible ? 'opacity-100' : 'opacity-0',
                      !prefersReducedMotion && 'transition-opacity duration-[300ms]',
                    )}
                  >
                    {OUTCOME_COPY[chosen]}
                  </p>
                ) : null}

                <div
                  aria-live="polite"
                  className={cn(
                    'w-full',
                    !playbackDone && phase === 'awaiting-decision' && 'hidden',
                    playbackDone &&
                      phase === 'awaiting-decision' &&
                      (prefersReducedMotion || fadeReady ? 'opacity-100' : 'opacity-0'),
                    playbackDone &&
                      phase === 'awaiting-decision' &&
                      !prefersReducedMotion &&
                      'transition-opacity duration-[400ms]',
                  )}
                >
                  <ButtonPair
                    yesButtonRef={yesRef}
                    chosen={chosen}
                    committing={committing}
                    onYes={() => handleCommit('yes')}
                    onNo={() => handleCommit('no')}
                    className="pt-2"
                  />
                </div>
              </div>
            ) : null}

            {showGhostContinue ? (
              <div
                className={cn(
                  'mt-auto flex w-full justify-end pt-4',
                  ghostFadeReady ? 'opacity-100' : 'opacity-0',
                  !prefersReducedMotion && 'transition-opacity duration-[300ms]',
                )}
              >
                <Button type="button" variant="ghost-continue" size="lg" onClick={handleContinue}>
                  Continue to today →
                </Button>
              </div>
            ) : null}
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
