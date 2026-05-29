import {
  dayCompletionSchema,
  type Completions,
} from '@/lib/schemas/completions.schema';

/**
 * Merges a read-it tap into completions for `todayUtc`, preserving existing flags and
 * setting `usedOfflinePack` when the session used the offline pack path.
 */
export function mergeMarkReadItCompletion(
  prev: Completions,
  todayUtc: string,
  usedOfflinePackThisSession: boolean,
): Completions {
  const prevDay = prev[todayUtc] ?? dayCompletionSchema.parse({});
  return {
    ...prev,
    [todayUtc]: dayCompletionSchema.parse({
      ...prevDay,
      hasReadIt: true,
      ...(usedOfflinePackThisSession ? { usedOfflinePack: true } : {}),
    }),
  };
}
