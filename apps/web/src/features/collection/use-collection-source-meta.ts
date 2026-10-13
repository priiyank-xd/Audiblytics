'use client';

import { useEffect, useState } from 'react';

import { fetchParagraphByUtcDate } from '@/lib/api/paragraphs';
import { fetchRecordings } from '@/lib/api/recordings';
import type { CollectionSourceContext } from '@/lib/collection/resolve-collection-source';
import { formatUtcDate } from '@/lib/day-counter/format-utc-date';
import type { CollectionWord } from '@/lib/schemas/collection.schema';

export type CollectionSourceMetaByParagraphId = Record<string, CollectionSourceContext>;

/**
 * Resolves paragraph theme + recording day for collection source labels.
 * Theme comes from the paragraph generated on the UTC day the word was saved.
 */
export function useCollectionSourceMeta(
  entries: CollectionWord[] | undefined,
): CollectionSourceMetaByParagraphId {
  const [meta, setMeta] = useState<CollectionSourceMetaByParagraphId>({});

  useEffect(() => {
    const withSource = (entries ?? []).filter((e) => e.sourceParagraphId != null);
    if (withSource.length === 0) {
      setMeta({});
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const recordings = await fetchRecordings().catch(() => []);
        const next: CollectionSourceMetaByParagraphId = {};
        const dates = [...new Set(withSource.map((e) => formatUtcDate(new Date(e.savedAt))))];
        const paragraphs = await Promise.all(dates.map((d) => fetchParagraphByUtcDate(d).catch(() => null)));

        for (const p of paragraphs) {
          if (p) next[p.id] = { theme: p.theme };
        }
        for (const r of recordings) {
          next[r.paragraphId] = { ...next[r.paragraphId], dayOfUse: r.dayOfUse };
        }

        if (!cancelled) setMeta(next);
      } catch (e) {
        console.warn('[collection] source meta load failed', e);
        if (!cancelled) setMeta({});
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [entries]);

  return meta;
}
