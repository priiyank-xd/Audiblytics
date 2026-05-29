'use client';

import { useLiveQuery } from 'dexie-react-hooks';

import { formatUtcDate } from '@/lib/day-counter/format-utc-date';
import { LIVE_QUERY_EMPTY_DEPS } from '@/lib/hooks/live-query-empty-deps';
import { paragraphSchema, type ParagraphResult } from '@/lib/llm/schemas/paragraph.schema';
import type { CachedParagraph } from '@/lib/schemas/paragraph-cache.schema';
import { db } from '@/lib/storage/db';

export type ParagraphOfTheDayStatus =
  | { status: 'loading' }
  | { status: 'hit'; cached: CachedParagraph; result: ParagraphResult }
  | { status: 'miss' };

async function queryMostRecentCachedParagraphForUtcToday(): Promise<CachedParagraph | null> {
  if (typeof indexedDB === 'undefined') {
    return null;
  }

  const today = formatUtcDate(new Date());
  const lower = `${today}T00:00:00.000Z`;
  const upper = `${today}T23:59:59.999Z`;

  const rows = await db.paragraphCache.where('generatedAt').between(lower, upper, true, true).toArray();
  if (rows.length === 0) return null;

  rows.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
  return rows[0];
}

/**
 * Reactive same-UTC-day paragraph cache read (FR19, AR10). Does not trigger generation.
 */
export function useParagraphOfTheDay(): ParagraphOfTheDayStatus {
  const row = useLiveQuery(() => queryMostRecentCachedParagraphForUtcToday(), LIVE_QUERY_EMPTY_DEPS);

  if (row === undefined) {
    return { status: 'loading' };
  }

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
