import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  coerceRecordingBlob,
  DEFAULT_RECORDING_MIME,
  resolveRecordingMimeType,
} from '@/lib/audio/play-recording';

test('resolveRecordingMimeType: prefers stored field, then blob type, then default', () => {
  assert.equal(resolveRecordingMimeType('audio/mp4'), 'audio/mp4');
  assert.equal(resolveRecordingMimeType('', new Blob([], { type: 'audio/webm' })), 'audio/webm');
  assert.equal(resolveRecordingMimeType('', new Blob([])), DEFAULT_RECORDING_MIME);
});

test('coerceRecordingBlob: re-wraps untyped Blob with resolved mime', () => {
  const raw = new Blob([Uint8Array.from([1, 2, 3])]);
  const wrapped = coerceRecordingBlob(raw, 'audio/webm');
  assert.equal(wrapped.type, 'audio/webm');
  assert.equal(wrapped.size, 3);
});

test('coerceRecordingBlob: accepts ArrayBuffer from IndexedDB', () => {
  const buf = Uint8Array.from([9, 8, 7]).buffer;
  const blob = coerceRecordingBlob(buf, 'audio/webm');
  assert.equal(blob.size, 3);
  assert.equal(blob.type, 'audio/webm');
});

test('coerceRecordingBlob: rejects empty payload', () => {
  assert.throws(() => coerceRecordingBlob(new Blob([]), 'audio/webm'), /empty/i);
});
