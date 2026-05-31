'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { pruneRecordingsOlderThanRollingWindow } from '@/features/voice-journal/prune-recordings';
import { isApiStorageBackend } from '@/lib/config/storage-backend';
import { readPersistedSettingsRetention } from '@/lib/storage/use-local-storage';
import type { StorageError } from '@/lib/storage/db';

export type UsePruneOnMountResult = {
  storageError: StorageError | null;
  retryPrune: () => void;
};

/**
 * Runs 90-day rolling retention prune once per component mount (AR23).
 * Reads `audiblytics.settings.retention` synchronously; skips when policy is `indefinite`.
 */
export function usePruneOnMount(): UsePruneOnMountResult {
  const ranRef = useRef(false);
  const [storageError, setStorageError] = useState<StorageError | null>(null);

  const run = useCallback(() => {
    if (isApiStorageBackend()) return;

    const retention = readPersistedSettingsRetention();
    if (retention !== '90-day-rolling') return;

    void (async () => {
      const result = await pruneRecordingsOlderThanRollingWindow();
      if (!result.ok) setStorageError(result.error);
    })();
  }, []);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;
    run();
  }, [run]);

  const retryPrune = useCallback(() => {
    if (isApiStorageBackend()) return;

    setStorageError(null);
    void (async () => {
      const retention = readPersistedSettingsRetention();
      if (retention !== '90-day-rolling') return;
      const result = await pruneRecordingsOlderThanRollingWindow();
      if (!result.ok) setStorageError(result.error);
    })();
  }, []);

  return { storageError, retryPrune };
}
