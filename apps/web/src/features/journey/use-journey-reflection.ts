'use client';

import { useCallback } from 'react';

import {
  journeyReflectionsSchema,
  type JourneyReflections,
} from '@/lib/schemas/journey-reflections.schema';
import { useLocalStorage } from '@/lib/storage/use-local-storage';

export function useJourneyReflection(utcDate: string | null) {
  const [stored, setStored] = useLocalStorage(
    'audiblytics.journeyReflections',
    journeyReflectionsSchema.parse({}),
    journeyReflectionsSchema,
  );

  const note = utcDate ? (stored.notesByUtcDate[utcDate] ?? '') : '';

  const setNote = useCallback(
    (next: string) => {
      if (!utcDate) return;
      setStored((prev: JourneyReflections) =>
        journeyReflectionsSchema.parse({
          notesByUtcDate: { ...prev.notesByUtcDate, [utcDate]: next },
        }),
      );
    },
    [setStored, utcDate],
  );

  return { note, setNote };
}
