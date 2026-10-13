'use client';

import { useEffect, useState } from 'react';

import { COLLECTION_MUTATED_EVENT } from '@/features/collection/collection-mutated';
import { fetchCollection } from '@/lib/api/collection';
import type { CollectionWord } from '@/lib/schemas/collection.schema';

/** Reactive list of collection words: `GET /collection` on mount + `audiblytics:collection-mutated`. */
export function useCollection(): CollectionWord[] | undefined {
  const [data, setData] = useState<CollectionWord[] | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    let generation = 0;

    const load = async () => {
      const id = ++generation;
      try {
        const value = await fetchCollection();
        if (cancelled || id !== generation) return;
        setData(value);
      } catch (e) {
        console.warn('[collection] load failed', e);
        if (!cancelled && id === generation) setData((prev) => prev ?? []);
      }
    };

    void load();

    const onReload = () => {
      void load();
    };

    window.addEventListener(COLLECTION_MUTATED_EVENT, onReload);
    return () => {
      cancelled = true;
      window.removeEventListener(COLLECTION_MUTATED_EVENT, onReload);
    };
  }, []);

  return data;
}
