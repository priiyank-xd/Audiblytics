'use client';

import Dexie from 'dexie';
import { useEffect, useState } from 'react';

import { enrichRecordingsWithTheme } from '@/features/voice-journal/enrich-recordings-with-theme';
import { RECORDINGS_MUTATED_EVENT } from '@/features/voice-journal/recordings-mutated';
import { fetchRecordings } from '@/lib/api/recordings';
import { isApiStorageBackend } from '@/lib/config/storage-backend';
import type { RecordingListItem } from '@/lib/schemas/recording.schema';
import { db } from '@/lib/storage/db';

export type RecordingWithTheme = RecordingListItem & {
  themeLabel: string;
  /** First hard word from cached paragraph — TTS fallback when blob playback fails. */
  ttsFallbackWord: string | null;
};

async function queryRecordingsWithThemeLocal(): Promise<RecordingWithTheme[]> {
  const rows = await db.recordings.orderBy('recordingDate').reverse().toArray();
  return enrichRecordingsWithTheme(rows);
}

async function queryRecordingsWithThemeApi(): Promise<RecordingWithTheme[]> {
  const rows = await fetchRecordings();
  return enrichRecordingsWithTheme(rows);
}

/**
 * Reactive list of recordings with theme labels.
 *
 * Local mode: loads from Dexie on mount + `storagemutated`.
 * API mode: loads from `GET /recordings` on mount + `audiblytics:recordings-mutated`.
 */
export function useRecordings(): RecordingWithTheme[] | undefined {
  const [data, setData] = useState<RecordingWithTheme[] | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    let generation = 0;
    const apiMode = isApiStorageBackend();

    const load = async () => {
      const id = ++generation;
      try {
        if (!apiMode) {
          await db.open();
        }
        const value = apiMode
          ? await queryRecordingsWithThemeApi()
          : await queryRecordingsWithThemeLocal();
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

    if (apiMode) {
      window.addEventListener(RECORDINGS_MUTATED_EVENT, onReload);
    } else {
      Dexie.on('storagemutated', onReload);
    }

    return () => {
      cancelled = true;
      if (apiMode) {
        window.removeEventListener(RECORDINGS_MUTATED_EVENT, onReload);
      } else {
        Dexie.on.storagemutated.unsubscribe(onReload);
      }
    };
  }, []);

  return data;
}
