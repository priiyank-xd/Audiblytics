import assert from 'node:assert/strict';
import { test } from 'node:test';

import { collectionWordSchema } from '@/lib/schemas/collection.schema';
import type { CollectionWord } from '@/lib/schemas/collection.schema';

import {
  difficultyDotClass,
  reviewProgressPercent,
  upNextWords,
} from '@/lib/review/review-session';

function word(id: string, w: string): CollectionWord {
  return collectionWordSchema.parse({
    id,
    word: w,
    ipa: '/w/',
    pronunciationGuide: 'w',
    meaning: 'm',
    exampleSentence: 'e',
    savedAt: '2026-01-01T00:00:00.000Z',
    sourceParagraphId: null,
    reviewCount: 0,
    lastReviewedAt: null,
    difficultyRating: 1,
  });
}

test('reviewProgressPercent', () => {
  assert.equal(reviewProgressPercent(0, 7), 0);
  assert.equal(reviewProgressPercent(3, 7), 43);
  assert.equal(reviewProgressPercent(7, 7), 100);
});

test('upNextWords returns following slice', () => {
  const q = [
    word('11111111-1111-4111-8111-111111111111', 'a'),
    word('22222222-2222-4222-8222-222222222222', 'b'),
    word('33333333-3333-4333-8333-333333333333', 'c'),
    word('44444444-4444-4444-8444-444444444444', 'd'),
  ];
  const next = upNextWords(q, 0, 3);
  assert.deepEqual(next.map((w) => w.word), ['b', 'c', 'd']);
  assert.equal(upNextWords(q, 3, 3).length, 0);
});

test('difficultyDotClass', () => {
  assert.match(difficultyDotClass(0), /primary/);
  assert.match(difficultyDotClass(2), /destructive/);
});
