import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  invalidateServerParagraphUtcDatesCache,
  loadServerParagraphUtcDates,
} from '@/features/calendar/paragraph-dates-server-cache';

test('loadServerParagraphUtcDates: dedupes concurrent fetches', async () => {
  invalidateServerParagraphUtcDatesCache();

  let fetchCount = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    fetchCount += 1;
    return new Response(JSON.stringify(['2026-05-31']), { status: 200 });
  };

  try {
    const [a, b] = await Promise.all([
      loadServerParagraphUtcDates(),
      loadServerParagraphUtcDates(),
    ]);
    assert.equal(fetchCount, 1);
    assert.equal(a.has('2026-05-31'), true);
    assert.equal(b.has('2026-05-31'), true);

    const cached = await loadServerParagraphUtcDates();
    assert.equal(fetchCount, 1);
    assert.equal(cached.has('2026-05-31'), true);
  } finally {
    globalThis.fetch = originalFetch;
    invalidateServerParagraphUtcDatesCache();
  }
});

test('invalidateServerParagraphUtcDatesCache: forces refetch', async () => {
  invalidateServerParagraphUtcDatesCache();

  let fetchCount = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    fetchCount += 1;
    return new Response(JSON.stringify(['2026-05-30']), { status: 200 });
  };

  try {
    await loadServerParagraphUtcDates();
    invalidateServerParagraphUtcDatesCache();
    const next = await loadServerParagraphUtcDates();
    assert.equal(fetchCount, 2);
    assert.equal(next.has('2026-05-30'), true);
  } finally {
    globalThis.fetch = originalFetch;
    invalidateServerParagraphUtcDatesCache();
  }
});
