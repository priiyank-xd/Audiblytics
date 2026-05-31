'use client';

import Dexie from 'dexie';
import { useEffect, useState } from 'react';

import { COLLECTION_MUTATED_EVENT } from '@/features/collection/collection-mutated';
import { fetchCollection } from '@/lib/api/collection';
import { isApiStorageBackend } from '@/lib/config/storage-backend';
import type { CollectionWord } from '@/lib/schemas/collection.schema';
import { db } from '@/lib/storage/db';

/**
 * Reactive list of collection words.
 *
 * Local mode: loads from Dexie on mount + `storagemutated`.
 * API mode: loads from `GET /collection` on mount + `audiblytics:collection-mutated`.
 */
export function useCollection(): CollectionWord[] | undefined {
  const [data, setData] = useState<CollectionWord[] | undefined>(undefined);

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
          ? await fetchCollection()
          : await db.collection.orderBy('savedAt').reverse().toArray();
        if (cancelled || id !== generation) return;
        setData(value);
      } catch (e) {
        console.warn('[collection] load failed', e);
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
      window.addEventListener(COLLECTION_MUTATED_EVENT, onReload);
    } else {
      Dexie.on('storagemutated', onReload);
    }

    return () => {
      cancelled = true;
      if (apiMode) {
        window.removeEventListener(COLLECTION_MUTATED_EVENT, onReload);
      } else {
        Dexie.on.storagemutated.unsubscribe(onReload);
      }
    };
  }, []);

  return data;
}
