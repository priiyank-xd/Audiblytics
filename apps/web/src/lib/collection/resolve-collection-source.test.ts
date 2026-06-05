import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { CollectionWord } from '@/lib/schemas/collection.schema';

import { resolveCollectionSourceLabel } from '@/lib/collection/resolve-collection-source';

const base: CollectionWord = {
  id: '11111111-1111-4111-8111-111111111111',
  word: 'heretofore',
  ipa: '/ˌhɛrɪˈtɔːfɔːr/',
  pronunciationGuide: 'Heh-ruh-toh-for',
  meaning: 'before now',
  exampleSentence: 'Heretofore unknown.',
  savedAt: '2026-05-12T12:00:00.000Z',
  sourceParagraphId: '22222222-2222-4222-8222-222222222222',
  reviewCount: 0,
  lastReviewedAt: null,
  difficultyRating: 1,
};

test('resolveCollectionSourceLabel: saved date when no paragraph', () => {
  const label = resolveCollectionSourceLabel({
    ...base,
    sourceParagraphId: null,
  });
  assert.match(label, /^Saved May 12, 2026$/);
});

test('resolveCollectionSourceLabel: theme and day', () => {
  const label = resolveCollectionSourceLabel(base, {
    theme: 'Adventure',
    dayOfUse: 12,
  });
  assert.equal(label, 'Adventure · Day 12');
});

test('resolveCollectionSourceLabel: theme only', () => {
  const label = resolveCollectionSourceLabel(base, { theme: 'Adventure' });
  assert.equal(label, 'Adventure');
});
