'use client';

import { useMemo } from 'react';

import { useStreak } from '@/features/calendar/use-streak';
import { useParagraphCacheUtcDateSet } from '@/features/calendar/use-paragraph-cache-utc-date-set';
import { useStatStreakSurface } from '@/features/calendar/stat-streak-surface-context';
import { useCompletions } from '@/features/calendar/use-completions';
import { useCollection } from '@/features/collection/use-collection';
import { longestStreakFromCompletedDates } from '@/lib/day-counter/longest-streak';
import { formatUtcDate } from '@/lib/day-counter/format-utc-date';
import {
  countCompletedSessions,
  listCompletedUtcDates,
} from '@/lib/journey/count-completed-sessions';

export type JourneyStats = {
  currentStreak: number;
  sessionsCompleted: number;
  longestStreak: number;
  wordsPracticed: number | undefined;
  isReady: boolean;
};

export function useJourneyStats(): JourneyStats {
  const currentStreak = useStreak();
  const completions = useCompletions() ?? {};
  const paragraphDates = useParagraphCacheUtcDateSet();
  const { hasParagraphForTodayOnScreen } = useStatStreakSurface();
  const collection = useCollection();

  return useMemo(() => {
    if (paragraphDates === undefined) {
      return {
        currentStreak,
        sessionsCompleted: 0,
        longestStreak: 0,
        wordsPracticed: collection?.filter((w) => w.reviewCount > 0).length,
        isReady: false,
      };
    }

    const todayUtc = formatUtcDate(new Date());
    const base = {
      completions,
      paragraphDates,
      todayUtc,
      hasParagraphForTodayOnScreen,
    };

    const completedDates = listCompletedUtcDates(base);

    return {
      currentStreak,
      sessionsCompleted: countCompletedSessions(base),
      longestStreak: longestStreakFromCompletedDates(completedDates),
      wordsPracticed: collection?.filter((w) => w.reviewCount > 0).length,
      isReady: true,
    };
  }, [
    collection,
    completions,
    currentStreak,
    hasParagraphForTodayOnScreen,
    paragraphDates,
  ]);
}
