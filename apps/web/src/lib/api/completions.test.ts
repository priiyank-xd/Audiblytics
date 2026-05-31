import assert from 'node:assert/strict';
import { test } from 'node:test';

import { fetchCompletions, upsertDayCompletion } from '@/lib/api/completions';

test('fetchCompletions: maps validated record', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        '2026-05-31': { hasReadIt: true, hasRecording: false, usedOfflinePack: false },
      }),
      { status: 200 },
    );

  try {
    const data = await fetchCompletions();
    assert.equal(data['2026-05-31']?.hasReadIt, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('upsertDayCompletion: PUT succeeds', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    assert.equal(String(input).endsWith('/api/v1/completions/2026-05-31'), true);
    assert.equal(init?.method, 'PUT');
    return new Response(
      JSON.stringify({
        utcDate: '2026-05-31',
        hasReadIt: true,
        hasRecording: false,
        usedOfflinePack: false,
      }),
      { status: 200 },
    );
  };

  try {
    const result = await upsertDayCompletion('2026-05-31', { hasReadIt: true });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.value.hasReadIt, true);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('upsertDayCompletion: network error returns storage error', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new TypeError('Failed to fetch');
  };

  try {
    const result = await upsertDayCompletion('2026-05-31', { hasRecording: true });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.error.message, /Failed to fetch/);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});
