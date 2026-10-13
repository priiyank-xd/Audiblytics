'use client';

import { useCallback, useEffect, useState } from 'react';

import { fetchParagraphToday } from '@/lib/api/paragraphs';
import { paragraphSchema, type ParagraphResult } from '@/lib/llm/schemas/paragraph.schema';
import type { CachedParagraph } from '@/lib/schemas/paragraph-cache.schema';

export type ParagraphOfTheDayStatus =
  | { status: 'loading' }
  | { status: 'hit'; cached: CachedParagraph; result: ParagraphResult }
  | { status: 'miss' };

function toParagraphStatus(row: CachedParagraph | null): ParagraphOfTheDayStatus {
  if (row === null) {
    return { status: 'miss' };
  }
  const parsed = paragraphSchema.safeParse({ paragraph: row.paragraph, hardWords: row.hardWords });
  if (!parsed.success) {
    console.warn('[paragraph] same-day cache row failed paragraph validation', parsed.error.issues);
    return { status: 'miss' };
  }
  return { status: 'hit', cached: row, result: parsed.data };
}

export function useParagraphOfTheDay(): ParagraphOfTheDayStatus {
  const [status, setStatus] = useState<ParagraphOfTheDayStatus>({ status: 'loading' });

  const refresh = useCallback(async () => {
    setStatus({ status: 'loading' });
    try {
      const row = await fetchParagraphToday();
      setStatus(toParagraphStatus(row));
    } catch (e) {
      console.warn('[paragraph] API today fetch failed', e);
      setStatus({ status: 'miss' });
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return status;
}
