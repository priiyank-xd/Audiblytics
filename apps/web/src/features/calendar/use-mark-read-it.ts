'use client';

import { useCallback, useMemo } from 'react';

import { notifyCompletionsMutated } from '@/features/calendar/completions-mutated';
import { evaluateCompletion } from '@/features/calendar/evaluate-completion';
import { useCompletions } from '@/features/calendar/use-completions';
import { upsertDayCompletion } from '@/lib/api/completions';
import { formatUtcDate } from '@/lib/day-counter/format-utc-date';
import { recordDayOfUse } from '@/lib/day-counter/index';

export type UseMarkReadItArgs = {
  /** Today’s paragraph is visible (session or cache), distinct from durable offline-only signals. */
  paragraphOnScreen: boolean;
};

export function useMarkReadIt({ paragraphOnScreen }: UseMarkReadItArgs) {
  const completions = useCompletions() ?? {};

  const todayUtc = formatUtcDate();
  const hasParagraphForDate = paragraphOnScreen;

  const todayComplete = useMemo(
    () =>
      evaluateCompletion({
        utcDate: todayUtc,
        completions,
        hasParagraphForDate,
      }),
    [completions, hasParagraphForDate, todayUtc],
  );
  const hasReadIt = completions[todayUtc]?.hasReadIt === true;
  const hasRecording = completions[todayUtc]?.hasRecording === true;

  const markReadIt = useCallback(() => {
    void (async () => {
      const result = await upsertDayCompletion(todayUtc, { hasReadIt: true });
      if (result.ok) {
        notifyCompletionsMutated();
      }
      recordDayOfUse();
    })();
  }, [todayUtc]);

  return { markReadIt, todayComplete, hasReadIt, hasRecording };
}
