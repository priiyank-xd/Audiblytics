import assert from 'node:assert/strict';
import { test } from 'node:test';

import { deriveRecordingRowLabels } from '@/lib/voice-journal/recording-row-labels';

test('deriveRecordingRowLabels: clarity tiers', () => {
  assert.equal(deriveRecordingRowLabels(10_000).clarity, 'Brief');
  assert.equal(deriveRecordingRowLabels(25_000).clarity, 'Good');
  assert.equal(deriveRecordingRowLabels(50_000).clarity, 'Steady');
});

test('deriveRecordingRowLabels: pace tiers', () => {
  assert.equal(deriveRecordingRowLabels(20_000).pace, 'Quick');
  assert.equal(deriveRecordingRowLabels(35_000).pace, 'Balanced');
  assert.equal(deriveRecordingRowLabels(50_000).pace, 'Slow');
});

test('deriveRecordingRowLabels: pauses from duration', () => {
  assert.equal(deriveRecordingRowLabels(10_000).pauses, '—');
  assert.equal(deriveRecordingRowLabels(30_000).pauses, '2 pauses');
  assert.equal(deriveRecordingRowLabels(15_000).pauses, '1 pause');
});
