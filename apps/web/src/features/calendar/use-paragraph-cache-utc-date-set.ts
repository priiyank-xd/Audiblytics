'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';

import { isApiStorageBackend } from '@/lib/config/storage-backend';
import { LIVE_QUERY_EMPTY_DEPS } from '@/lib/hooks/live-query-empty-deps';

import {
  loadDexieParagraphCacheUtcDateSet,
  mergeParagraphUtcDateSets,
} from './load-paragraph-cache-utc-date-set';
import { PARAGRAPH_DATES_MUTATED_EVENT } from './paragraph-dates-mutated';
import { loadServerParagraphUtcDates } from './paragraph-dates-server-cache';

/** Reactive paragraph UTC dates for calendar/streak/journey (Dexie + deduped API cache). */
export function useParagraphCacheUtcDateSet(): ReadonlySet<string> | undefined {
  const apiMode = isApiStorageBackend();
  const localDates = useLiveQuery(() => loadDexieParagraphCacheUtcDateSet(), LIVE_QUERY_EMPTY_DEPS);
  const [serverDates, setServerDates] = useState<ReadonlySet<string> | undefined>(
    apiMode ? undefined : new Set(),
  );

  useEffect(() => {
    if (!apiMode) return;

    let cancelled = false;
    let generation = 0;

    const load = async () => {
      const id = ++generation;
      try {
        const value = await loadServerParagraphUtcDates();
        if (!cancelled && id === generation) {
          setServerDates(value);
        }
      } catch (e) {
        console.warn('[calendar] paragraph dates API load failed', e);
        if (!cancelled && id === generation) {
          setServerDates(new Set());
        }
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
  }, [apiMode]);

  return useMemo(() => {
    if (localDates === undefined) return undefined;
    if (!apiMode) return localDates;
    if (serverDates === undefined) return undefined;
    return mergeParagraphUtcDateSets(localDates, serverDates);
  }, [apiMode, localDates, serverDates]);
}
