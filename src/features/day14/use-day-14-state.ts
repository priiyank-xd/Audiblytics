'use client';

import { persistDay14Outcome } from '@/features/day14/persist-day-14-outcome';
import { day14StateSchema, type Day14State } from '@/lib/schemas/day14-state.schema';
import { DAY14_STATE_STORAGE_KEY, useLocalStorage } from '@/lib/storage/use-local-storage';

const defaultDay14State = day14StateSchema.parse({});

/** Reactive read/write for `audiblytics.day14State` (FR39 — Zod-validated, no raw localStorage). */
export function useDay14State(): readonly [
  Day14State,
  (value: Day14State | ((prev: Day14State) => Day14State)) => void,
] {
  return useLocalStorage(DAY14_STATE_STORAGE_KEY, defaultDay14State, day14StateSchema);
}

/** Sync persist + notify `useLocalStorage` subscribers (Story 7.4). */
export function commitYesNo(result: 'yes' | 'no'): void {
  persistDay14Outcome(result);
}
