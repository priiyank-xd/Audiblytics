import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { CollectionWord } from '@/lib/schemas/collection.schema';

import {
  countByTab,
  filterCollectionBySearch,
  filterCollectionByTab,
} from '@/lib/collection/collection-filters';

function word(overrides: Partial<CollectionWord> = {}): CollectionWord {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    word: 'alpha',
    ipa: '/ˈælfə/',
    pronunciationGuide: 'AL-fuh',
    meaning: 'first letter',
    exampleSentence: 'Alpha comes first.',
    savedAt: '2026-05-31T12:00:00.000Z',
    sourceParagraphId: null,
    reviewCount: 0,
    lastReviewedAt: null,
    difficultyRating: 1,
    ...overrides,
  };
}

test('filterCollectionByTab: practicing and mastered', () => {
  const entries = [
    word({ id: '11111111-1111-4111-8111-111111111111', reviewCount: 0 }),
    word({
      id: '22222222-2222-4222-8222-222222222222',
      reviewCount: 2,
      difficultyRating: 2,
    }),
    word({
      id: '33333333-3333-4333-8333-333333333333',
      reviewCount: 3,
      difficultyRating: 0,
    }),
  ];

  assert.equal(filterCollectionByTab(entries, 'all').length, 3);
  assert.equal(filterCollectionByTab(entries, 'practicing').length, 2);
  assert.equal(filterCollectionByTab(entries, 'mastered').length, 1);
  assert.equal(filterCollectionByTab(entries, 'mastered')[0]?.id, '33333333-3333-4333-8333-333333333333');
});

test('filterCollectionBySearch: word and meaning', () => {
  const entries = [
    word({ word: 'heretofore', meaning: 'before now' }),
    word({ id: '22222222-2222-4222-8222-222222222222', word: 'miasma', meaning: 'fog' }),
  ];
  assert.equal(filterCollectionBySearch(entries, 'HERE').length, 1);
  assert.equal(filterCollectionBySearch(entries, 'fog').length, 1);
  assert.equal(filterCollectionBySearch(entries, '').length, 2);
});

test('countByTab', () => {
  const entries = [
    word({ reviewCount: 0 }),
    word({
      id: '22222222-2222-4222-8222-222222222222',
      reviewCount: 1,
      difficultyRating: 0,
    }),
  ];
  const counts = countByTab(entries);
  assert.equal(counts.all, 2);
  assert.equal(counts.practicing, 1);
  assert.equal(counts.mastered, 1);
});
