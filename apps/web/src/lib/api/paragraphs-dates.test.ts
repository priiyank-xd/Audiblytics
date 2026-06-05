import assert from 'node:assert/strict';
import { test } from 'node:test';

import { fetchParagraphDates } from '@/lib/api/paragraphs';

test('fetchParagraphDates: validates YYYY-MM-DD array', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    assert.equal(String(input).includes('/api/v1/paragraphs/dates'), true);
    return new Response(JSON.stringify(['2026-05-30', '2026-05-31']), { status: 200 });
  };

  try {
    const dates = await fetchParagraphDates();
    assert.deepEqual(dates, ['2026-05-30', '2026-05-31']);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('fetchParagraphDates: forwards from/to query', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = String(input);
    assert.equal(url.includes('from=2026-05-01'), true);
    assert.equal(url.includes('to=2026-05-31'), true);
    return new Response(JSON.stringify([]), { status: 200 });
  };

  try {
    const dates = await fetchParagraphDates({ from: '2026-05-01', to: '2026-05-31' });
    assert.deepEqual(dates, []);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
