'use client';

import Dexie from 'dexie';
import { useEffect, useState } from 'react';

import { enrichRecordingsWithTheme } from '@/features/voice-journal/enrich-recordings-with-theme';
import type { VoiceRecording } from '@/lib/schemas/recording.schema';
import { db } from '@/lib/storage/db';

export type RecordingWithTheme = VoiceRecording & {
  themeLabel: string;
  /** First hard word from cached paragraph — TTS fallback when blob playback fails. */
  ttsFallbackWord: string | null;
};

async function queryRecordingsWithTheme(): Promise<RecordingWithTheme[]> {
  const rows = await db.recordings.orderBy('recordingDate').reverse().toArray();
  return enrichRecordingsWithTheme(rows);
}

/**
 * Reactive list of recordings with theme labels.
 *
 * Does **not** use `Dexie.liveQuery` / `useLiveQuery`: in dev, React Strict Mode
 * runs effect cleanup before `liveQuery`’s deferred `setTimeout(0)` tick, which
 * aborts the first run so `next` never fires and the UI stays on `undefined`.
 *
 * Loads explicitly on mount, then re-fetches on global `storagemutated` (same
 * signal `liveQuery` uses internally).
 */
export function useRecordings(): RecordingWithTheme[] | undefined {
  const [data, setData] = useState<RecordingWithTheme[] | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    let generation = 0;

    const load = async () => {
      const id = ++generation;
      try {
        await db.open();
        const value = await queryRecordingsWithTheme();
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

    const onStorageMutated = () => {
      void load();
    };

    Dexie.on('storagemutated', onStorageMutated);

    return () => {
      cancelled = true;
      Dexie.on.storagemutated.unsubscribe(onStorageMutated);
    };
  }, []);

  return data;
}
