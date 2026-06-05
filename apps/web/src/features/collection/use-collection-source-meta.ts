'use client';

import { useEffect, useState } from 'react';

import type { CollectionSourceContext } from '@/lib/collection/resolve-collection-source';
import type { CollectionWord } from '@/lib/schemas/collection.schema';
import { db } from '@/lib/storage/db';

export type CollectionSourceMetaByParagraphId = Record<string, CollectionSourceContext>;

/**
 * Resolves paragraph theme + recording day for collection source labels (Dexie).
 * API mode may return partial data until paragraph cache syncs server-side.
 */
export function useCollectionSourceMeta(
  entries: CollectionWord[] | undefined,
): CollectionSourceMetaByParagraphId {
  const [meta, setMeta] = useState<CollectionSourceMetaByParagraphId>({});

  useEffect(() => {
    if (!entries?.length) {
      setMeta({});
      return;
    }

    const paragraphIds = [
      ...new Set(
        entries
          .map((e) => e.sourceParagraphId)
          .filter((id): id is string => id != null),
      ),
    ];

    if (paragraphIds.length === 0) {
      setMeta({});
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        await db.open();
        const next: CollectionSourceMetaByParagraphId = {};

        for (const paragraphId of paragraphIds) {
          const paragraph = await db.paragraphCache.get(paragraphId);
          const recording = await db.recordings
            .where('paragraphId')
            .equals(paragraphId)
            .first();

          if (paragraph?.theme || recording?.dayOfUse != null) {
            next[paragraphId] = {
              theme: paragraph?.theme,
              dayOfUse: recording?.dayOfUse,
            };
          }
        }

        if (!cancelled) {
          setMeta(next);
        }
      } catch (e) {
        console.warn('[collection] source meta load failed', e);
        if (!cancelled) {
          setMeta({});
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [entries]);

  return meta;
}
