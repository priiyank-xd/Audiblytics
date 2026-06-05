'use client';

import { useEffect, useState } from 'react';

import { DAYS_OF_USE_MUTATED_EVENT } from '@/lib/day-counter/days-of-use-mutated';
import { loadServerDaysOfUse } from '@/lib/day-counter/days-of-use-server-cache';
import { isApiStorageBackend } from '@/lib/config/storage-backend';

/**
 * Server-backed UTC days-of-use list for API mode (undefined while loading).
 * Local mode returns an empty array without fetching.
 */
export function useServerDaysOfUse(): readonly string[] | undefined {
  const apiMode = isApiStorageBackend();
  const [serverDays, setServerDays] = useState<readonly string[] | undefined>(
    apiMode ? undefined : [],
  );

  useEffect(() => {
    if (!apiMode) return;

    let cancelled = false;
    let generation = 0;

    const load = async () => {
      const id = ++generation;
      try {
        const value = await loadServerDaysOfUse();
        if (!cancelled && id === generation) {
          setServerDays(value);
        }
      } catch (e) {
        console.warn('[day-counter] days-of-use API load failed', e);
        if (!cancelled && id === generation) {
          setServerDays([]);
        }
      }
    };

    void load();

    const onReload = () => {
      void load();
    };

    window.addEventListener(DAYS_OF_USE_MUTATED_EVENT, onReload);
    return () => {
      cancelled = true;
      window.removeEventListener(DAYS_OF_USE_MUTATED_EVENT, onReload);
    };
  }, [apiMode]);

  return serverDays;
}
