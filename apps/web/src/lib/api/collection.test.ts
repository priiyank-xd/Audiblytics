import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  deleteCollectionWord,
  fetchCollection,
  saveCollectionWord,
} from '@/lib/api/collection';
import type { CollectionWord } from '@/lib/schemas/collection.schema';

const WORD: CollectionWord = {
  id: '11111111-1111-4111-8111-111111111111',
  word: 'serendipity',
  ipa: '/ˌsɛrənˈdɪpɪti/',
  pronunciationGuide: 'ser-en-DIP-i-tee',
  meaning: 'pleasant surprise',
  exampleSentence: 'Finding the book was pure serendipity.',
  savedAt: '2026-05-31T12:00:00.000Z',
  sourceParagraphId: '22222222-2222-4222-8222-222222222222',
  reviewCount: 0,
  lastReviewedAt: null,
  difficultyRating: 1,
};

test('fetchCollection: maps validated rows', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(JSON.stringify([WORD]), { status: 200 });

  try {
    const rows = await fetchCollection();
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.word, WORD.word);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('saveCollectionWord: POST succeeds', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    assert.equal(url.endsWith('/api/v1/collection'), true);
    assert.equal(init?.method, 'POST');
    return new Response(JSON.stringify(WORD), { status: 201 });
  };

  try {
    const result = await saveCollectionWord(WORD);
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.value.id, WORD.id);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('saveCollectionWord: network error returns storage error', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new TypeError('Failed to fetch');
  };

  try {
    const result = await saveCollectionWord(WORD);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.error.message, /Failed to fetch/);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('saveCollectionWord: malformed body returns validation error', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ id: 'not-a-uuid' }), { status: 201 });

  try {
    const result = await saveCollectionWord(WORD);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.error.message, /validation/i);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('deleteCollectionWord: DELETE 204 succeeds', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    assert.equal(url.endsWith(`/api/v1/collection/${WORD.id}`), true);
    assert.equal(init?.method, 'DELETE');
    return new Response(null, { status: 204 });
  };

  try {
    const result = await deleteCollectionWord(WORD.id);
    assert.equal(result.ok, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('deleteCollectionWord: 404 returns storage error', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({ detail: { error: { message: 'Collection word not found.' } } }),
      { status: 404 },
    );

  try {
    const result = await deleteCollectionWord(WORD.id);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.error.message, /not found/i);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});
