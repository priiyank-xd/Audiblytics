import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  appendServerDaysOfUseCache,
  getCachedServerDaysOfUse,
  invalidateServerDaysOfUseCache,
  loadServerDaysOfUse,
} from '@/lib/day-counter/days-of-use-server-cache';

test('loadServerDaysOfUse: dedupes concurrent fetches', async () => {
  invalidateServerDaysOfUseCache();

  let fetchCount = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    fetchCount += 1;
    return new Response(JSON.stringify(['2026-05-31']), { status: 200 });
  };

  try {
    const [a, b] = await Promise.all([loadServerDaysOfUse(), loadServerDaysOfUse()]);
    assert.equal(fetchCount, 1);
    assert.deepEqual([...a], ['2026-05-31']);
    assert.deepEqual([...b], ['2026-05-31']);
    assert.deepEqual([...getCachedServerDaysOfUse()], ['2026-05-31']);
  } finally {
    globalThis.fetch = originalFetch;
    invalidateServerDaysOfUseCache();
  }
});

test('appendServerDaysOfUseCache: idempotent and sorted', () => {
  invalidateServerDaysOfUseCache();
  appendServerDaysOfUseCache('2026-05-31');
  appendServerDaysOfUseCache('2026-05-15');
  appendServerDaysOfUseCache('2026-05-31');
  assert.deepEqual([...getCachedServerDaysOfUse()], ['2026-05-15', '2026-05-31']);
});
