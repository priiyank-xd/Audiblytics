import assert from 'node:assert/strict';
import { test } from 'node:test';

import { resolveTodayDisplayParagraph } from '@/features/offline-pack/resolve-today-display-paragraph';
import type { ParagraphResult } from '@/lib/llm/schemas/paragraph.schema';

const session: ParagraphResult = { paragraph: 'session', hardWords: [] };
const cached: ParagraphResult = { paragraph: 'cached', hardWords: [] };

test('resolveTodayDisplayParagraph: offline session overrides cache hit', () => {
  assert.deepEqual(
    resolveTodayDisplayParagraph({
      usedOfflinePackThisSession: true,
      sessionParagraph: session,
      cacheHit: true,
      cachedParagraph: cached,
    }),
    session,
  );
});

test('resolveTodayDisplayParagraph: session paragraph overrides cache hit', () => {
  assert.deepEqual(
    resolveTodayDisplayParagraph({
      usedOfflinePackThisSession: false,
      sessionParagraph: session,
      cacheHit: true,
      cachedParagraph: cached,
    }),
    session,
  );
});

test('resolveTodayDisplayParagraph: cache hit when no session paragraph', () => {
  assert.deepEqual(
    resolveTodayDisplayParagraph({
      usedOfflinePackThisSession: false,
      sessionParagraph: null,
      cacheHit: true,
      cachedParagraph: cached,
    }),
    cached,
  );
});

test('resolveTodayDisplayParagraph: session paragraph on miss', () => {
  assert.deepEqual(
    resolveTodayDisplayParagraph({
      usedOfflinePackThisSession: false,
      sessionParagraph: session,
      cacheHit: false,
      cachedParagraph: null,
    }),
    session,
  );
});
