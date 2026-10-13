import type { Completions } from '@/lib/schemas/completions.schema';

/**
 * FR53: day is “complete” when a paragraph exists for that UTC calendar day (caller supplies
 * `hasParagraphForDate` from the server paragraph dates) and the
 * user engaged via read or recording.
 */
export function evaluateCompletion(params: {
  utcDate: string;
  completions: Completions;
  hasParagraphForDate: boolean;
}): boolean {
  if (!params.hasParagraphForDate) return false;
  const entry = params.completions[params.utcDate];
  if (!entry) return false;
  return entry.hasReadIt === true || entry.hasRecording === true;
}
