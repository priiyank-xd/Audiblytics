'use client';

import { useEffect, useState } from 'react';

import type { ArchivedDaySnapshot } from '@/features/calendar/use-archived-day';
import { excerptParagraphWords } from '@/features/calendar/excerpt-paragraph-words';
import { useCollection } from '@/features/collection/use-collection';
import {
  enrichRecordingsForArchivedDay,
} from '@/features/voice-journal/enrich-recordings-with-theme';
import { RECORDINGS_MUTATED_EVENT } from '@/features/voice-journal/recordings-mutated';
import { fetchParagraphByUtcDate } from '@/lib/api/paragraphs';
import { fetchRecordings } from '@/lib/api/recordings';
import { formatUtcDate } from '@/lib/day-counter/format-utc-date';
import type { CollectionWord } from '@/lib/schemas/collection.schema';
import { filterRecordingsForUtcDate } from '@/lib/voice-journal/filter-recordings-for-utc-date';

const EMPTY_SNAPSHOT: ArchivedDaySnapshot = {
  cached: null,
  excerpt: null,
  savedWordsCount: 0,
  recordings: [],
};

function countSavedWordsForUtcDate(
  collection: CollectionWord[] | undefined,
  utcDate: string,
): number {
  return (collection ?? []).filter(
    (w) => formatUtcDate(new Date(w.savedAt)) === utcDate,
  ).length;
}

export function useArchivedDayApi(utcDate: string | null): ArchivedDaySnapshot | undefined {
  const collection = useCollection();
  const [snapshot, setSnapshot] = useState<ArchivedDaySnapshot | undefined>(undefined);

  useEffect(() => {
    if (!utcDate) {
      setSnapshot(EMPTY_SNAPSHOT);
      return;
    }

    let cancelled = false;
    let generation = 0;

    const load = async (options: { showLoading: boolean }) => {
      const id = ++generation;
      if (options.showLoading) {
        setSnapshot(undefined);
      }

      try {
        const cached = await fetchParagraphByUtcDate(utcDate);
        const excerpt = cached ? excerptParagraphWords(cached.paragraph, 30) : null;
        const allRecordings = await fetchRecordings();
        const dayRecordings = filterRecordingsForUtcDate(allRecordings, utcDate);
        const recordings = enrichRecordingsForArchivedDay(dayRecordings, cached);
        const savedWordsCount = countSavedWordsForUtcDate(collection, utcDate);

        if (cancelled || id !== generation) return;
        setSnapshot({ cached, excerpt, savedWordsCount, recordings });
      } catch (e) {
        console.warn('[archived-day] API snapshot load failed', e);
        if (!cancelled && id === generation) {
          setSnapshot(EMPTY_SNAPSHOT);
        }
      }
    };

    void load({ showLoading: true });

    const onReload = () => {
      void load({ showLoading: false });
    };

    window.addEventListener(RECORDINGS_MUTATED_EVENT, onReload);
    return () => {
      cancelled = true;
      window.removeEventListener(RECORDINGS_MUTATED_EVENT, onReload);
    };
    // `collection` patched in separate effect — avoids skeleton flicker on hydrate.
  }, [utcDate]);

  useEffect(() => {
    if (!utcDate || collection === undefined) return;

    setSnapshot((prev) => {
      if (prev === undefined) return prev;
      const savedWordsCount = countSavedWordsForUtcDate(collection, utcDate);
      if (prev.savedWordsCount === savedWordsCount) return prev;
      return { ...prev, savedWordsCount };
    });
  }, [utcDate, collection]);

  return snapshot;
}
