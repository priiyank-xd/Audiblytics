import assert from 'node:assert/strict';
import { test } from 'node:test';

import { evaluateCompletion } from '@/features/calendar/evaluate-completion';

test('evaluateCompletion: false without paragraph signal', () => {
  assert.equal(
    evaluateCompletion({
      utcDate: '2026-05-01',
      completions: {
        '2026-05-01': { hasReadIt: true, hasRecording: false, usedOfflinePack: false },
      },
      hasParagraphForDate: false,
    }),
    false,
  );
});

test('evaluateCompletion: true with paragraph and engagement', () => {
  assert.equal(
    evaluateCompletion({
      utcDate: '2026-05-01',
      completions: {
        '2026-05-01': { hasReadIt: true, hasRecording: false, usedOfflinePack: false },
      },
      hasParagraphForDate: true,
    }),
    true,
  );
});

test('evaluateCompletion: false with paragraph but no engagement', () => {
  assert.equal(
    evaluateCompletion({
      utcDate: '2026-05-01',
      completions: {
        '2026-05-01': { hasReadIt: false, hasRecording: false, usedOfflinePack: false },
      },
      hasParagraphForDate: true,
    }),
    false,
  );
});
