import assert from 'node:assert/strict';
import test from 'node:test';

import { collectionWordSchema } from '@/lib/schemas/collection.schema';
import type { CollectionWord } from '@/lib/schemas/collection.schema';

import { REVIEW_BATCH_SIZE, selectReviewQueueBatch } from '@/features/review/use-review-queue';

function cw(
  partial: Partial<CollectionWord> &
    Pick<CollectionWord, 'id' | 'word' | 'savedAt' | 'lastReviewedAt'>,
): CollectionWord {
  return collectionWordSchema.parse({
    ipa: '/t/',
    meaning: 'meaning',
    exampleSentence: 'Example.',
    sourceParagraphId: null,
    reviewCount: 0,
    difficultyRating: 1,
    ...partial,
  });
}

test('selectReviewQueueBatch: never-reviewed first, savedAt ascending tie-break', () => {
  const newer = cw({
    id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
    word: 'b',
    savedAt: '2026-02-01T12:00:00.000Z',
    lastReviewedAt: null,
  });
  const older = cw({
    id: 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',
    word: 'a',
    savedAt: '2026-01-01T12:00:00.000Z',
    lastReviewedAt: null,
  });
  const q = selectReviewQueueBatch([newer, older]);
  assert.deepEqual(
    q.map((w) => w.word),
    ['a', 'b'],
  );
});

test('selectReviewQueueBatch: null lastReviewed before any reviewed, then lastReviewedAt ascending', () => {
  const reviewedOld = cw({
    id: '11111111-1111-4111-8111-111111111111',
    word: 'old',
    savedAt: '2026-01-01T00:00:00.000Z',
    lastReviewedAt: '2026-01-01T00:00:00.000Z',
  });
  const reviewedNew = cw({
    id: '22222222-2222-4222-8222-222222222222',
    word: 'mid',
    savedAt: '2026-01-02T00:00:00.000Z',
    lastReviewedAt: '2026-06-01T00:00:00.000Z',
  });
  const fresh = cw({
    id: '33333333-3333-4333-8333-333333333333',
    word: 'fresh',
    savedAt: '2026-03-01T00:00:00.000Z',
    lastReviewedAt: null,
  });
  const q = selectReviewQueueBatch([reviewedNew, reviewedOld, fresh]);
  assert.deepEqual(q.map((w) => w.word), ['fresh', 'old', 'mid']);
});

test('selectReviewQueueBatch: caps at REVIEW_BATCH_SIZE', () => {
  const rows: CollectionWord[] = [];
  for (let i = 0; i < 10; i++) {
    rows.push(
      cw({
        id: `00000000-0000-4000-8000-${String(1000 + i).padStart(12, '0')}`,
        word: `w${i}`,
        savedAt: `2026-01-${String(i + 1).padStart(2, '0')}T00:00:00.000Z`,
        lastReviewedAt: null,
      }),
    );
  }
  const q = selectReviewQueueBatch(rows);
  assert.equal(q.length, REVIEW_BATCH_SIZE);
});

test('selectReviewQueueBatch: returns all when fewer than batch size', () => {
  const rows = [
    cw({
      id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
      word: 'x',
      savedAt: '2026-01-02T00:00:00.000Z',
      lastReviewedAt: null,
    }),
    cw({
      id: 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',
      word: 'y',
      savedAt: '2026-01-03T00:00:00.000Z',
      lastReviewedAt: null,
    }),
  ];
  assert.equal(selectReviewQueueBatch(rows).length, 2);
});
