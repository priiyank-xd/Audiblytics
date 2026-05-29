'use client';

import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';

import { useDistinctDayOfUse } from '@/lib/day-counter/use-distinct-day-of-use';
import { LIVE_QUERY_EMPTY_DEPS } from '@/lib/hooks/live-query-empty-deps';
import { db } from '@/lib/storage/db';

import {
  evaluateDay14Trigger,
  type Day14TriggerResult,
} from '@/features/day14/evaluate-day-14-trigger';
import { useDay14State } from '@/features/day14/use-day-14-state';

export type { Day14TriggerResult } from '@/features/day14/evaluate-day-14-trigger';

/**
 * FR37 / NFR12: exact-once Day-14 trigger for layout-level Day14Gate (Story 7.2).
 * Evaluated on shell mount via this hook — not intra-session navigation alone.
 */
export function useDay14Trigger(): Day14TriggerResult {
  const distinctDays = useDistinctDayOfUse();
  const [day14State] = useDay14State();
  const hasDay1Recording = useLiveQuery(
    async () => {
      const row = await db.recordings.where('dayOfUse').equals(1).first();
      return row !== undefined;
    },
    LIVE_QUERY_EMPTY_DEPS,
    undefined,
  );

  return useMemo(
    () =>
      evaluateDay14Trigger(
        distinctDays,
        day14State.fired,
        hasDay1Recording === undefined ? null : hasDay1Recording,
      ),
    [distinctDays, day14State.fired, hasDay1Recording],
  );
}
