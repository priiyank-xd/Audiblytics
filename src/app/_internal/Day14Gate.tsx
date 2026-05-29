'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState, type ReactNode } from 'react';

import { commitYesNo } from '@/features/day14/use-day-14-state';
import { useDay14Trigger } from '@/features/day14/use-day-14-trigger';

const Day14Takeover = dynamic(
  () =>
    import('@/components/audiblytics/Day14Takeover').then((m) => ({
      default: m.Day14Takeover,
    })),
  { ssr: false, loading: () => null },
);

export function Day14Gate({ children }: { children: ReactNode }) {
  const trigger = useDay14Trigger();
  const [takeoverActive, setTakeoverActive] = useState(() => trigger === true);

  // Latch: keep takeover mounted through outcome + ghost continue after `fired` clears trigger.
  useEffect(() => {
    if (trigger === true) {
      // async latch to satisfy react-hooks/set-state-in-effect
      queueMicrotask(() => setTakeoverActive(true));
    }
  }, [trigger]);

  const onCommitOutcome = useCallback((result: 'yes' | 'no') => {
    commitYesNo(result);
  }, []);

  const onDismiss = useCallback(() => {
    setTakeoverActive(false);
  }, []);

  if (takeoverActive) {
    return <Day14Takeover onCommitOutcome={onCommitOutcome} onDismiss={onDismiss} />;
  }

  return children;
}
