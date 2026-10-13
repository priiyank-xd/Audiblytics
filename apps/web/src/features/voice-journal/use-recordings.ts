'use client';

import { useEffect, useState } from 'react';

import { enrichRecordingsWithTheme } from '@/features/voice-journal/enrich-recordings-with-theme';
import { RECORDINGS_MUTATED_EVENT } from '@/features/voice-journal/recordings-mutated';
import { fetchRecordings } from '@/lib/api/recordings';
import type { RecordingListItem } from '@/lib/schemas/recording.schema';

export type RecordingWithTheme = RecordingListItem & {
  themeLabel: string;
  /** First hard word from cached paragraph — TTS fallback when blob playback fails. */
  ttsFallbackWord: string | null;
};

async function queryRecordingsWithThemeApi(): Promise<RecordingWithTheme[]> {
  const rows = await fetchRecordings();
  return enrichRecordingsWithTheme(rows);
}

/** Reactive list of recordings with theme labels: `GET /recordings` on mount + `audiblytics:recordings-mutated`. */
export function useRecordings(): RecordingWithTheme[] | undefined {
  const [data, setData] = useState<RecordingWithTheme[] | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    let generation = 0;

    const load = async () => {
      const id = ++generation;
      try {
        const value = await queryRecordingsWithThemeApi();
        if (cancelled || id !== generation) return;
        setData(value);
      } catch (e) {
        console.warn('[voice-journal] recordings load failed', e);
        if (!cancelled && id === generation) {
          setData([]);
        }
      }
    };

    void load();

    const onReload = () => {
      void load();
    };

    window.addEventListener(RECORDINGS_MUTATED_EVENT, onReload);

    return () => {
      cancelled = true;
      window.removeEventListener(RECORDINGS_MUTATED_EVENT, onReload);
    };
  }, []);

  return data;
}
