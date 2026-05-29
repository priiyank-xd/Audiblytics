'use client';

import { useLiveQuery } from 'dexie-react-hooks';

import { db } from '@/lib/storage/db';
import { LIVE_QUERY_EMPTY_DEPS } from '@/lib/hooks/live-query-empty-deps';

export function useCollection() {
  return useLiveQuery(async () => {
    return await db.collection.orderBy('savedAt').reverse().toArray();
  }, LIVE_QUERY_EMPTY_DEPS);
}

