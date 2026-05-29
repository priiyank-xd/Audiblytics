import assert from 'node:assert/strict';
import { test } from 'node:test';

import { mergeMarkReadItCompletion } from '@/features/calendar/merge-mark-read-it-completion';

test('mergeMarkReadItCompletion: sets hasReadIt only when offline pack not used', () => {
  const next = mergeMarkReadItCompletion(
    { '2026-05-15': { hasReadIt: false, hasRecording: true, usedOfflinePack: false } },
    '2026-05-15',
    false,
  );
  assert.equal(next['2026-05-15']?.hasReadIt, true);
  assert.equal(next['2026-05-15']?.hasRecording, true);
  assert.equal(next['2026-05-15']?.usedOfflinePack, false);
});

test('mergeMarkReadItCompletion: sets usedOfflinePack when session used offline pack', () => {
  const next = mergeMarkReadItCompletion({}, '2026-05-15', true);
  assert.equal(next['2026-05-15']?.hasReadIt, true);
  assert.equal(next['2026-05-15']?.usedOfflinePack, true);
});

test('mergeMarkReadItCompletion: preserves existing usedOfflinePack when not in session', () => {
  const next = mergeMarkReadItCompletion(
    { '2026-05-15': { hasReadIt: false, hasRecording: false, usedOfflinePack: true } },
    '2026-05-15',
    false,
  );
  assert.equal(next['2026-05-15']?.usedOfflinePack, true);
});
