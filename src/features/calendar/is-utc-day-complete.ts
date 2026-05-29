import { evaluateCompletion } from '@/features/calendar/evaluate-completion';
import type { Completions } from '@/lib/schemas/completions.schema';
import { utcDateSchema } from '@/lib/schemas/days-of-use.schema';

/**
 * FR53 completion for a UTC calendar day — delegates to {@link evaluateCompletion} so rules stay
 * single-sourced (Story 4.2). Callers supply `hasParagraphForDate` from Dexie cache and/or
 * `usedOfflinePack` on the completion row.
 */
export function isUtcDayCompleteFromInputs(params: {
  utcDate: string;
  completions: Completions;
  hasParagraphForDate: boolean;
}): boolean {
  const parsed = utcDateSchema.safeParse(params.utcDate);
  if (!parsed.success) return false;
  return evaluateCompletion({
    utcDate: parsed.data,
    completions: params.completions,
    hasParagraphForDate: params.hasParagraphForDate,
  });
}
