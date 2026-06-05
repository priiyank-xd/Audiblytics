import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  formatDurationLabel,
  formatRecordingDateTime,
} from '@/lib/voice-journal/format-recording-display';

test('formatRecordingDateTime: local date and time', () => {
  const ref = new Date('2026-05-27T12:00:00.000Z');
  const formatted = formatRecordingDateTime('2026-05-27T14:14:00.000Z', ref);
  assert.match(formatted, /May 27, 2026/);
  assert.match(formatted, /·/);
});

test('formatDurationLabel: mm:ss', () => {
  assert.equal(formatDurationLabel(134_000), '2:14');
  assert.equal(formatDurationLabel(45_000), '0:45');
});
