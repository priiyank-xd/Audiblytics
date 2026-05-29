'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const PHASE_MS = 30_000;

export type WarmUpPhase = 'with_pen' | 'transition' | 'without_pen';

export type WarmUpStateMachine = {
  phase: WarmUpPhase;
  withPenMs: number;
  withoutPenMs: number;
  activeElapsedMs: number;
  formattedTimer: string;
};

function formatCountUp(ms: number): string {
  const capped = Math.min(Math.max(0, ms), PHASE_MS);
  const totalSec = Math.floor(capped / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

type UseWarmUpStateMachineArgs = {
  onFinished: () => void;
};

/**
 * With-pen 30s (rAF) → brief `transition` → without-pen 30s (rAF) → `onFinished`.
 */
export function useWarmUpStateMachine({ onFinished }: UseWarmUpStateMachineArgs): WarmUpStateMachine {
  const [phase, setPhase] = useState<WarmUpPhase>('with_pen');
  const [withPenMs, setWithPenMs] = useState(0);
  const [withoutPenMs, setWithoutPenMs] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const finishedRef = useRef(false);
  const onFinishedRef = useRef(onFinished);
  onFinishedRef.current = onFinished;

  const stopRaf = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const runTimedPass = useCallback(
    (onTick: (elapsed: number) => void, onComplete: () => void) => {
      stopRaf();
      startRef.current = performance.now();

      const tick = (now: number) => {
        const start = startRef.current ?? now;
        const raw = now - start;
        if (raw >= PHASE_MS) {
          stopRaf();
          onTick(PHASE_MS);
          onComplete();
          return;
        }
        onTick(raw);
        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    },
    [stopRaf],
  );

  useEffect(() => {
    if (phase !== 'with_pen') return;

    runTimedPass(
      (ms) => setWithPenMs(ms),
      () => {
        setPhase('transition');
      },
    );

    return () => {
      stopRaf();
    };
  }, [phase, runTimedPass, stopRaf]);

  const transitionRafIds = useRef({ outer: 0, inner: 0 });

  useLayoutEffect(() => {
    if (phase !== 'transition') return;

    transitionRafIds.current.outer = requestAnimationFrame(() => {
      transitionRafIds.current.inner = requestAnimationFrame(() => {
        setWithoutPenMs(0);
        setPhase('without_pen');
      });
    });

    return () => {
      cancelAnimationFrame(transitionRafIds.current.outer);
      cancelAnimationFrame(transitionRafIds.current.inner);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== 'without_pen') return;

    runTimedPass(
      (ms) => setWithoutPenMs(ms),
      () => {
        if (finishedRef.current) return;
        finishedRef.current = true;
        onFinishedRef.current();
      },
    );

    return () => {
      stopRaf();
    };
  }, [phase, runTimedPass, stopRaf]);

  const formattedTimer =
    phase === 'with_pen'
      ? formatCountUp(withPenMs)
      : phase === 'transition'
        ? formatCountUp(PHASE_MS)
        : formatCountUp(withoutPenMs);

  const activeElapsedMs =
    phase === 'with_pen' ? withPenMs : phase === 'without_pen' ? withoutPenMs : PHASE_MS;

  return { phase, withPenMs, withoutPenMs, activeElapsedMs, formattedTimer };
}
