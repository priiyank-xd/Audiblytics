import type { CachedParagraph } from '@/lib/schemas/paragraph-cache.schema';
import { db } from '@/lib/storage/db';

/**
 * One paragraph per UTC calendar day for MVP. If multiple cache rows exist for the same UTC day,
 * returns the row with the latest `generatedAt`.
 */
export async function queryLatestCachedParagraphForUtcDate(utcDate: string): Promise<CachedParagraph | null> {
  const lower = `${utcDate}T00:00:00.000Z`;
  const upper = `${utcDate}T23:59:59.999Z`;

  const rows = await db.paragraphCache.where('generatedAt').between(lower, upper, true, true).toArray();
  if (rows.length === 0) return null;

  rows.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
  return rows[0];
}
