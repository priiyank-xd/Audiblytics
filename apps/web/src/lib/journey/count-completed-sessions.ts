import { evaluateCompletion } from '@/features/calendar/evaluate-completion';
import {
  collectUtcDatesForCompletionReview,
  hasParagraphForUtcDate,
} from '@/lib/journey/completion-sources';
import type { Completions } from '@/lib/schemas/completions.schema';

export function countCompletedSessions(params: {
  completions: Completions;
  paragraphDates: ReadonlySet<string>;
  todayUtc: string;
  hasParagraphForTodayOnScreen: boolean;
}): number {
  const dates = collectUtcDatesForCompletionReview({
    completions: params.completions,
    paragraphDates: params.paragraphDates,
    todayUtc: params.todayUtc,
    includeTodayWhenParagraphOnScreen: params.hasParagraphForTodayOnScreen,
  });

  let count = 0;
  for (const utcDate of dates) {
    const hasParagraphForDate = hasParagraphForUtcDate({
      utcDate,
      todayUtc: params.todayUtc,
      paragraphDates: params.paragraphDates,
      completions: params.completions,
      hasParagraphForTodayOnScreen: params.hasParagraphForTodayOnScreen,
    });
    if (
      evaluateCompletion({
        utcDate,
        completions: params.completions,
        hasParagraphForDate,
      })
    ) {
      count += 1;
    }
  }
  return count;
}

export function listCompletedUtcDates(params: {
  completions: Completions;
  paragraphDates: ReadonlySet<string>;
  todayUtc: string;
  hasParagraphForTodayOnScreen: boolean;
}): string[] {
  const dates = collectUtcDatesForCompletionReview({
    completions: params.completions,
    paragraphDates: params.paragraphDates,
    todayUtc: params.todayUtc,
    includeTodayWhenParagraphOnScreen: params.hasParagraphForTodayOnScreen,
  });

  const completed: string[] = [];
  for (const utcDate of dates) {
    const hasParagraphForDate = hasParagraphForUtcDate({
      utcDate,
      todayUtc: params.todayUtc,
      paragraphDates: params.paragraphDates,
      completions: params.completions,
      hasParagraphForTodayOnScreen: params.hasParagraphForTodayOnScreen,
    });
    if (
      evaluateCompletion({
        utcDate,
        completions: params.completions,
        hasParagraphForDate,
      })
    ) {
      completed.push(utcDate);
    }
  }
  return completed.sort();
}
