import assert from 'node:assert/strict';
import test from 'node:test';

import { recordingSchema } from '@/lib/schemas/recording.schema';
import { buildWarmupRecordingParagraphId, isWarmupRecordingParagraphId } from '@/lib/warmup-recording-id';

test('warmup paragraph id: normalized phrase is stable', () => {
  const pen = buildWarmupRecordingParagraphId('  Brass  ', 'pen');
  const pen2 = buildWarmupRecordingParagraphId('brass', 'pen');
  assert.equal(pen, pen2);
  const nop = buildWarmupRecordingParagraphId('brass', 'nop');
  assert.equal(pen.slice(0, -3), nop.slice(0, -3));
  assert.ok(isWarmupRecordingParagraphId(pen));
  assert.ok(isWarmupRecordingParagraphId(nop));
});

test('warmup paragraph id: recording schema accepts union branch', () => {
  const pen = buildWarmupRecordingParagraphId('brass', 'pen');
  const parsed = recordingSchema.safeParse({
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    recordingDate: '2026-05-14T12:00:00.000Z',
    paragraphId: pen,
    durationMs: 5000,
    mimeType: 'audio/webm',
    blob: new Blob([]),
    dayOfUse: 2,
  });
  assert.equal(parsed.success, true);
});
