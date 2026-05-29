'use client';

import { useCallback, useMemo } from 'react';

import { evaluateCompletion } from '@/features/calendar/evaluate-completion';
import { mergeMarkReadItCompletion } from '@/features/calendar/merge-mark-read-it-completion';
import { formatUtcDate } from '@/lib/day-counter/format-utc-date';
import { recordDayOfUse } from '@/lib/day-counter/index';
import { completionsSchema } from '@/lib/schemas/completions.schema';
import { useLocalStorage } from '@/lib/storage/use-local-storage';

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
  const [completions, setCompletions] = useLocalStorage(
    'audiblytics.completions',
    completionsSchema.parse({}),
    completionsSchema,
  );

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
    setCompletions((prev) =>
      mergeMarkReadItCompletion(prev, todayUtc, usedOfflinePackThisSession),
    );
    recordDayOfUse();
  }, [setCompletions, todayUtc, usedOfflinePackThisSession]);

  return { markReadIt, todayComplete, hasReadIt, hasRecording };
}
