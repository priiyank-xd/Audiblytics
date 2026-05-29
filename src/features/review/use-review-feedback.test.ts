import assert from 'node:assert/strict';
import test from 'node:test';

import { collectionWordSchema } from '@/lib/schemas/collection.schema';
import type { CollectionWord } from '@/lib/schemas/collection.schema';

import { applyFeedbackToWord } from '@/features/review/use-review-feedback';

function sampleRow(over: Partial<CollectionWord> = {}): CollectionWord {
  return collectionWordSchema.parse({
    id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
    word: 'test',
    ipa: '/tɛst/',
    meaning: 'A check.',
    exampleSentence: 'Run a test.',
    savedAt: '2026-01-01T00:00:00.000Z',
    sourceParagraphId: null,
    reviewCount: 0,
    lastReviewedAt: null,
    difficultyRating: 1,
    ...over,
  });
}

const NOW = '2026-05-14T12:00:00.000Z';

test('applyFeedbackToWord: got-it decrements difficulty, increments review', () => {
  const row = sampleRow({ difficultyRating: 2, reviewCount: 3 });
  const next = applyFeedbackToWord(row, 'got-it', NOW);
  assert.equal(next.reviewCount, 4);
  assert.equal(next.difficultyRating, 1);
  assert.equal(next.lastReviewedAt, NOW);
});

test('applyFeedbackToWord: got-it clamps difficulty at 0', () => {
  const row = sampleRow({ difficultyRating: 0 });
  const next = applyFeedbackToWord(row, 'got-it', NOW);
  assert.equal(next.difficultyRating, 0);
});

test('applyFeedbackToWord: almost leaves difficulty unchanged', () => {
  const row = sampleRow({ difficultyRating: 1 });
  const next = applyFeedbackToWord(row, 'almost', NOW);
  assert.equal(next.difficultyRating, 1);
  assert.equal(next.reviewCount, 1);
});

test('applyFeedbackToWord: forgot increments difficulty, caps at 2', () => {
  const row = sampleRow({ difficultyRating: 1 });
  const next = applyFeedbackToWord(row, 'forgot', NOW);
  assert.equal(next.difficultyRating, 2);
  const capped = applyFeedbackToWord(sampleRow({ difficultyRating: 2 }), 'forgot', NOW);
  assert.equal(capped.difficultyRating, 2);
});
