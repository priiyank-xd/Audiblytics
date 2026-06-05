import assert from 'node:assert/strict';
import { test } from 'node:test';

import { fetchParagraphByUtcDate } from '@/lib/api/paragraphs';

test('fetchParagraphByUtcDate: 404 returns null', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response('', { status: 404 });

  try {
    const result = await fetchParagraphByUtcDate('2020-01-01');
    assert.equal(result, null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('fetchParagraphByUtcDate: maps cached paragraph', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    assert.equal(String(input).includes('/api/v1/paragraphs/by-date/2026-05-31'), true);
    return new Response(
      JSON.stringify({
        id: '11111111-1111-4111-8111-111111111111',
        paragraph: 'Hello world.',
        hardWords: [
          {
            word: 'hello',
            ipa: '/həˈloʊ/',
            pronunciationGuide: 'huh-LOH',
            meaning: 'greeting',
            exampleSentence: 'Hello there.',
          },
        ],
        theme: 'adventure',
        persona: 'explorer',
        generatedAt: '2026-05-31T12:00:00.000Z',
      }),
      { status: 200 },
    );
  };

  try {
    const result = await fetchParagraphByUtcDate('2026-05-31');
    assert.ok(result);
    assert.equal(result?.paragraph, 'Hello world.');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
