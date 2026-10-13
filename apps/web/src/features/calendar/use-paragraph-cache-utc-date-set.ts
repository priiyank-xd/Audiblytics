'use client';

import { useEffect, useState } from 'react';

import { PARAGRAPH_DATES_MUTATED_EVENT } from './paragraph-dates-mutated';
import { loadServerParagraphUtcDates } from './paragraph-dates-server-cache';

/** Reactive paragraph UTC dates for calendar/streak/journey (deduped API cache). */
export function useParagraphCacheUtcDateSet(): ReadonlySet<string> | undefined {
  const [dates, setDates] = useState<ReadonlySet<string> | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    let generation = 0;

    const load = async () => {
      const id = ++generation;
      try {
        const value = await loadServerParagraphUtcDates();
        if (!cancelled && id === generation) setDates(value);
      } catch (e) {
        console.warn('[calendar] paragraph dates API load failed', e);
        if (!cancelled && id === generation) setDates((prev) => prev ?? new Set());
      }
    };

    void load();

    const onReload = () => {
      void load();
    };

    window.addEventListener(PARAGRAPH_DATES_MUTATED_EVENT, onReload);
    return () => {
      cancelled = true;
      window.removeEventListener(PARAGRAPH_DATES_MUTATED_EVENT, onReload);
    };
  }, []);

  return dates;
}
