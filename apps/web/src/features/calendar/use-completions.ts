'use client';

import { useEffect, useState } from 'react';

import { COMPLETIONS_MUTATED_EVENT } from '@/features/calendar/completions-mutated';
import { fetchCompletions } from '@/lib/api/completions';
import type { Completions } from '@/lib/schemas/completions.schema';

/** Reactive completions map: `GET /completions` on mount + `audiblytics:completions-mutated`. */
export function useCompletions(): Completions | undefined {
  const [completions, setCompletions] = useState<Completions | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    let generation = 0;

    const load = async () => {
      const id = ++generation;
      try {
        const value = await fetchCompletions();
        if (cancelled || id !== generation) return;
        setCompletions(value);
      } catch (e) {
        console.warn('[completions] load failed', e);
        if (!cancelled && id === generation) setCompletions({});
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
  }, []);

  return completions;
}
