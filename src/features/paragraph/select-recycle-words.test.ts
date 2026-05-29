import assert from 'node:assert/strict';
import test from 'node:test';

import { selectRecycleWords } from '@/features/paragraph/select-recycle-words';
import { collectionWordSchema, type CollectionWord } from '@/lib/schemas/collection.schema';

function mockWord(overrides: Partial<CollectionWord> & Pick<CollectionWord, 'word' | 'id'>): CollectionWord {
  return collectionWordSchema.parse({
    ipa: '/test/',
    meaning: 'n · test',
    exampleSentence: 'Example.',
    savedAt: '2026-01-01T12:00:00.000Z',
    sourceParagraphId: null,
    reviewCount: 0,
    lastReviewedAt: null,
    difficultyRating: 1,
    ...overrides,
  });
}

test('selectRecycleWords: cold-start (<2 saved) → empty', () => {
  assert.deepEqual(selectRecycleWords([]), []);
  assert.deepEqual(selectRecycleWords([mockWord({ id: '550e8400-e29b-41d4-a716-446655440001', word: 'solo' })]), []);
});

test('selectRecycleWords: exactly two saved → both words, unique', () => {
  const a = mockWord({ id: '550e8400-e29b-41d4-a716-446655440001', word: 'alpha' });
  const b = mockWord({ id: '550e8400-e29b-41d4-a716-446655440002', word: 'beta' });
  const got = selectRecycleWords([a, b]);
  assert.equal(got.length, 2);
  assert.deepEqual(new Set(got.map((w) => w.id)), new Set([a.id, b.id]));
});

test('selectRecycleWords: ≥3 saved → 2 or 3 distinct picks from pool', () => {
  const pool = [
    mockWord({ id: '550e8400-e29b-41d4-a716-446655440001', word: 'w1' }),
    mockWord({ id: '550e8400-e29b-41d4-a716-446655440002', word: 'w2' }),
    mockWord({ id: '550e8400-e29b-41d4-a716-446655440003', word: 'w3' }),
    mockWord({ id: '550e8400-e29b-41d4-a716-446655440004', word: 'w4' }),
  ];
  const poolIds = new Set(pool.map((w) => w.id));

  for (let i = 0; i < 80; i += 1) {
    const got = selectRecycleWords(pool);
    assert.ok(got.length === 2 || got.length === 3);
    assert.equal(new Set(got.map((w) => w.id)).size, got.length);
    assert.ok(got.every((w) => poolIds.has(w.id)));
  }
});
