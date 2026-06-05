import assert from 'node:assert/strict';
import { test } from 'node:test';

import { fetchDaysOfUse, stampDayOfUse } from '@/lib/api/days-of-use';

test('fetchDaysOfUse: validates date array', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(JSON.stringify(['2026-05-30', '2026-05-31']), { status: 200 });

  try {
    const dates = await fetchDaysOfUse();
    assert.deepEqual(dates, ['2026-05-30', '2026-05-31']);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('stampDayOfUse: POST returns utcDate', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    assert.equal(String(input).endsWith('/api/v1/days-of-use'), true);
    assert.equal(init?.method, 'POST');
    return new Response(JSON.stringify({ utcDate: '2026-05-31' }), { status: 201 });
  };

  try {
    const date = await stampDayOfUse('2026-05-31');
    assert.equal(date, '2026-05-31');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
