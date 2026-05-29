import assert from 'node:assert/strict';
import test from 'node:test';

import { persistParagraphToCache } from '@/features/paragraph/persist-paragraph-cache';
import type { ParagraphResult } from '@/lib/llm/schemas/paragraph.schema';

const baseResult: ParagraphResult = {
  paragraph:
    'The detective traced the cipher through the ledger until the pattern snapped into place.',
  hardWords: [
    {
      word: 'ledger',
      ipa: '/ˈlɛdʒər/',
      pronunciationGuide: 'LEJ-er',
      meaning: 'n · book of accounts',
      exampleSentence: 'She checked the ledger.',
    },
  ],
};

test('persistParagraphToCache: invalid id fails before Dexie write', async () => {
  const r = await persistParagraphToCache({
    id: 'not-a-uuid',
    theme: 'horror',
    persona: 'gre-aspirant',
    generatedAt: '2026-01-01T12:00:00.000Z',
    result: baseResult,
  });
  assert.equal(r.ok, false);
  if (!r.ok) {
    assert.equal(r.error.kind, 'unknown');
  }
});

test('persistParagraphToCache: rejects empty hardWords for cache row', async () => {
  const r = await persistParagraphToCache({
    id: '550e8400-e29b-41d4-a716-446655440099',
    theme: 'horror',
    persona: 'gre-aspirant',
    generatedAt: '2026-01-01T12:00:00.000Z',
    result: {
      paragraph: baseResult.paragraph,
      hardWords: [],
    } as ParagraphResult,
  });
  assert.equal(r.ok, false);
});
