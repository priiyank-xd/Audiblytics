'use client';

import { useArchivedDayApi } from '@/features/calendar/use-archived-day-api';
import type { RecordingWithTheme } from '@/features/voice-journal/use-recordings';
import type { CachedParagraph } from '@/lib/schemas/paragraph-cache.schema';

export type ArchivedDaySnapshot = {
  cached: CachedParagraph | null;
  excerpt: string | null;
  savedWordsCount: number;
  recordings: RecordingWithTheme[];
};

export function useArchivedDay(utcDate: string | null): ArchivedDaySnapshot | undefined {
  return useArchivedDayApi(utcDate);
}
