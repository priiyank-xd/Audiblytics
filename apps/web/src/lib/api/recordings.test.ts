import assert from 'node:assert/strict';
import { test } from 'node:test';

import { saveRecordingViaApi } from '@/lib/api/recordings';

const INPUT = {
  rowId: '11111111-1111-4111-8111-111111111111',
  blob: new Blob([Uint8Array.from([1, 2, 3])], { type: 'audio/webm' }),
  mimeType: 'audio/webm',
  durationMs: 3000,
  paragraphId: '22222222-2222-4222-8222-222222222222',
  recordingDate: '2026-05-31T12:00:00.000Z',
  dayOfUse: 1,
};

test('saveRecordingViaApi: presign → PUT → complete succeeds', async () => {
  const calls: Array<{ url: string; method: string }> = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    const method = init?.method ?? 'GET';
    calls.push({ url, method });

    if (url.endsWith('/api/v1/recordings') && method === 'POST') {
      return new Response(
        JSON.stringify({
          recordingId: INPUT.rowId,
          uploadUrl: 'https://r2.example/upload',
          expiresIn: 900,
        }),
        { status: 201 },
      );
    }
    if (url === 'https://r2.example/upload' && method === 'PUT') {
      return new Response(null, { status: 200 });
    }
    if (url.endsWith(`/api/v1/recordings/${INPUT.rowId}/complete`) && method === 'POST') {
      return new Response(
        JSON.stringify({
          id: INPUT.rowId,
          recordingDate: INPUT.recordingDate,
          paragraphId: INPUT.paragraphId,
          durationMs: INPUT.durationMs,
          mimeType: INPUT.mimeType,
          dayOfUse: INPUT.dayOfUse,
          storageKey: 'recordings/u/r.webm',
        }),
        { status: 200 },
      );
    }
    return new Response('unexpected', { status: 500 });
  };

  try {
    const result = await saveRecordingViaApi(INPUT);
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.value.id, INPUT.rowId);
      assert.equal(result.value.blob, INPUT.blob);
    }
    assert.deepEqual(
      calls.map((c) => c.method),
      ['POST', 'PUT', 'POST'],
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('saveRecordingViaApi: PUT failure returns storage error', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    const method = init?.method ?? 'GET';
    if (url.endsWith('/api/v1/recordings') && method === 'POST') {
      return new Response(
        JSON.stringify({ uploadUrl: 'https://r2.example/upload', recordingId: INPUT.rowId, expiresIn: 900 }),
        { status: 201 },
      );
    }
    if (url === 'https://r2.example/upload') {
      return new Response('fail', { status: 503 });
    }
    return new Response('unexpected', { status: 500 });
  };

  try {
    const result = await saveRecordingViaApi(INPUT);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.kind, 'unknown');
      assert.match(result.error.message, /Upload to storage failed/);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('saveRecordingViaApi: network error returns storage error', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new TypeError('Failed to fetch');
  };

  try {
    const result = await saveRecordingViaApi(INPUT);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.kind, 'unknown');
      assert.match(result.error.message, /Failed to fetch/);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('saveRecordingViaApi: malformed complete body returns validation error', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    const method = init?.method ?? 'GET';
    if (url.endsWith('/api/v1/recordings') && method === 'POST') {
      return new Response(
        JSON.stringify({ uploadUrl: 'https://r2.example/upload', recordingId: INPUT.rowId, expiresIn: 900 }),
        { status: 201 },
      );
    }
    if (url === 'https://r2.example/upload') {
      return new Response(null, { status: 200 });
    }
    if (url.endsWith(`/api/v1/recordings/${INPUT.rowId}/complete`) && method === 'POST') {
      return new Response(JSON.stringify({ id: 'not-a-uuid' }), { status: 200 });
    }
    return new Response('unexpected', { status: 500 });
  };

  try {
    const result = await saveRecordingViaApi(INPUT);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.kind, 'unknown');
      assert.match(result.error.message, /validation/i);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});
