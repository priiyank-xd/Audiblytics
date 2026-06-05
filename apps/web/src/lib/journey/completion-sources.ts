import type { Completions } from '@/lib/schemas/completions.schema';

/** UTC dates worth evaluating for session completion (union of known sources). */
export function collectUtcDatesForCompletionReview(params: {
  completions: Completions;
  paragraphDates: ReadonlySet<string>;
  todayUtc: string;
  includeTodayWhenParagraphOnScreen: boolean;
}): string[] {
  const dates = new Set<string>();

  for (const utcDate of Object.keys(params.completions)) {
    dates.add(utcDate);
  }
  for (const utcDate of params.paragraphDates) {
    dates.add(utcDate);
  }
  if (params.includeTodayWhenParagraphOnScreen) {
    dates.add(params.todayUtc);
  }

  return [...dates].sort();
}

export function hasParagraphForUtcDate(params: {
  utcDate: string;
  todayUtc: string;
  paragraphDates: ReadonlySet<string>;
  completions: Completions;
  hasParagraphForTodayOnScreen: boolean;
}): boolean {
  return (
    params.paragraphDates.has(params.utcDate) ||
    params.completions[params.utcDate]?.usedOfflinePack === true ||
    (params.utcDate === params.todayUtc && params.hasParagraphForTodayOnScreen)
  );
}
