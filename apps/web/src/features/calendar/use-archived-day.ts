'use client';

import { useLiveQuery } from 'dexie-react-hooks';

import { excerptParagraphWords } from '@/features/calendar/excerpt-paragraph-words';
import { queryLatestCachedParagraphForUtcDate } from '@/features/calendar/query-latest-cached-paragraph-for-utc-date';
import { useArchivedDayApi } from '@/features/calendar/use-archived-day-api';
import { enrichRecordingsWithTheme } from '@/features/voice-journal/enrich-recordings-with-theme';
import type { RecordingWithTheme } from '@/features/voice-journal/use-recordings';
import { isApiStorageBackend } from '@/lib/config/storage-backend';
import { formatUtcDate } from '@/lib/day-counter/format-utc-date';
import type { CachedParagraph } from '@/lib/schemas/paragraph-cache.schema';
import { db } from '@/lib/storage/db';

export type ArchivedDaySnapshot = {
  cached: CachedParagraph | null;
  excerpt: string | null;
  savedWordsCount: number;
  recordings: RecordingWithTheme[];
};

function useArchivedDayLocal(utcDate: string | null): ArchivedDaySnapshot | undefined {
  const dep = utcDate ?? '';

  return useLiveQuery(
    async (): Promise<ArchivedDaySnapshot> => {
      if (!utcDate) {
        return { cached: null, excerpt: null, savedWordsCount: 0, recordings: [] };
      }

      const cached = await queryLatestCachedParagraphForUtcDate(utcDate);
      const excerpt = cached ? excerptParagraphWords(cached.paragraph, 30) : null;

      const collectionRows = await db.collection.toArray();
      const savedWordsCount = collectionRows.filter(
        (w) => formatUtcDate(new Date(w.savedAt)) === utcDate,
      ).length;

      const recRows = await db.recordings
        .filter((r) => formatUtcDate(new Date(r.recordingDate)) === utcDate)
        .toArray();
      recRows.sort(
        (a, b) => new Date(b.recordingDate).getTime() - new Date(a.recordingDate).getTime(),
      );
      const recordings = await enrichRecordingsWithTheme(recRows);

      return { cached, excerpt, savedWordsCount, recordings };
    },
    [dep],
  );
}

export function useArchivedDay(utcDate: string | null): ArchivedDaySnapshot | undefined {
  const apiMode = isApiStorageBackend();
  const api = useArchivedDayApi(apiMode ? utcDate : null);
  const local = useArchivedDayLocal(apiMode ? null : utcDate);
  return apiMode ? api : local;
}
