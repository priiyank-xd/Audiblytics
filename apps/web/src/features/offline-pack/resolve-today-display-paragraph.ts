import type { ParagraphResult } from '@/lib/llm/schemas/paragraph.schema';

/**
 * Session offline-pack paragraph wins over same-day Dexie cache (FR62 offline fallback).
 */
export function resolveTodayDisplayParagraph(args: {
  usedOfflinePackThisSession: boolean;
  sessionParagraph: ParagraphResult | null;
  cacheHit: boolean;
  cachedParagraph: ParagraphResult | null;
}): ParagraphResult | null {
  if (args.usedOfflinePackThisSession && args.sessionParagraph !== null) {
    return args.sessionParagraph;
  }
  if (args.sessionParagraph !== null) {
    return args.sessionParagraph;
  }
  if (args.cacheHit && args.cachedParagraph !== null) {
    return args.cachedParagraph;
  }
  return null;
}
