'use client';

import { useEffect, useState } from 'react';

import { COMPLETIONS_MUTATED_EVENT } from '@/features/calendar/completions-mutated';
import { fetchCompletions } from '@/lib/api/completions';
import { isApiStorageBackend } from '@/lib/config/storage-backend';
import { completionsSchema, type Completions } from '@/lib/schemas/completions.schema';
import { useLocalStorage } from '@/lib/storage/use-local-storage';

/**
 * Reactive completions map.
 *
 * Local mode: `useLocalStorage` subscription on `audiblytics.completions`.
 * API mode: `GET /completions` on mount + `audiblytics:completions-mutated`.
 */
export function useCompletions(): Completions | undefined {
  const apiMode = isApiStorageBackend();
  const [localCompletions] = useLocalStorage(
    'audiblytics.completions',
    completionsSchema.parse({}),
    completionsSchema,
  );
  const [apiCompletions, setApiCompletions] = useState<Completions | undefined>(undefined);

  useEffect(() => {
    if (!apiMode) return;

    let cancelled = false;
    let generation = 0;

    const load = async () => {
      const id = ++generation;
      try {
        const value = await fetchCompletions();
        if (cancelled || id !== generation) return;
        setApiCompletions(value);
      } catch (e) {
        console.warn('[completions] load failed', e);
        if (!cancelled && id === generation) {
          setApiCompletions({});
        }
      }
    };

    void load();

    const onReload = () => {
      void load();
    };

    window.addEventListener(COMPLETIONS_MUTATED_EVENT, onReload);
    return () => {
      cancelled = true;
      window.removeEventListener(COMPLETIONS_MUTATED_EVENT, onReload);
    };
  }, [apiMode]);

  if (apiMode) {
    return apiCompletions;
  }

  return localCompletions;
}
