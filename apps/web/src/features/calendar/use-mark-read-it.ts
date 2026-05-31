'use client';

import { useCallback, useMemo } from 'react';

import { notifyCompletionsMutated } from '@/features/calendar/completions-mutated';
import { evaluateCompletion } from '@/features/calendar/evaluate-completion';
import { mergeMarkReadItCompletion } from '@/features/calendar/merge-mark-read-it-completion';
import { useCompletions } from '@/features/calendar/use-completions';
import { upsertDayCompletion } from '@/lib/api/completions';
import { isApiStorageBackend } from '@/lib/config/storage-backend';
import { formatUtcDate } from '@/lib/day-counter/format-utc-date';
import { recordDayOfUse } from '@/lib/day-counter/index';
import { readCompletions, writeCompletions } from '@/lib/storage/use-local-storage';

export type UseMarkReadItArgs = {
  /** Today’s paragraph is visible (session or cache), distinct from durable offline-only signals. */
  paragraphOnScreen: boolean;
  /** Set when Today applied an offline-pack paragraph this session (Story 8.3). */
  usedOfflinePackThisSession?: boolean;
};

export function useMarkReadIt({
  paragraphOnScreen,
  usedOfflinePackThisSession = false,
}: UseMarkReadItArgs) {
  const apiMode = isApiStorageBackend();
  const completions = useCompletions() ?? {};

  const todayUtc = formatUtcDate();
  const hasParagraphForDate =
    paragraphOnScreen || completions[todayUtc]?.usedOfflinePack === true;

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
    if (apiMode) {
      void (async () => {
        const result = await upsertDayCompletion(todayUtc, {
          hasReadIt: true,
          ...(usedOfflinePackThisSession ? { usedOfflinePack: true } : {}),
        });
        if (result.ok) {
          notifyCompletionsMutated();
        }
        recordDayOfUse();
      })();
      return;
    }

    writeCompletions(
      mergeMarkReadItCompletion(readCompletions(), todayUtc, usedOfflinePackThisSession),
    );
    recordDayOfUse();
  }, [apiMode, todayUtc, usedOfflinePackThisSession]);

  return { markReadIt, todayComplete, hasReadIt, hasRecording };
}
