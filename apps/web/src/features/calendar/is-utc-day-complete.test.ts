import assert from 'node:assert/strict';
import { test } from 'node:test';

import { isUtcDayCompleteFromInputs } from '@/features/calendar/is-utc-day-complete';

test('isUtcDayCompleteFromInputs: true when paragraph exists and hasReadIt or hasRecording', () => {
  const completions = {
    '2026-05-01': { hasReadIt: true, hasRecording: false, usedOfflinePack: false },
    '2026-05-02': { hasReadIt: false, hasRecording: true, usedOfflinePack: false },
    '2026-05-03': { hasReadIt: false, hasRecording: false, usedOfflinePack: false },
  };

  assert.equal(
    isUtcDayCompleteFromInputs({ utcDate: '2026-05-01', completions, hasParagraphForDate: true }),
    true,
  );
  assert.equal(
    isUtcDayCompleteFromInputs({ utcDate: '2026-05-02', completions, hasParagraphForDate: true }),
    true,
  );
  assert.equal(
    isUtcDayCompleteFromInputs({ utcDate: '2026-05-03', completions, hasParagraphForDate: true }),
    false,
  );
});

test('isUtcDayCompleteFromInputs: false without paragraph-for-date even if hasReadIt', () => {
  const completions = {
    '2026-05-10': { hasReadIt: true, hasRecording: false, usedOfflinePack: false },
  };
  assert.equal(
    isUtcDayCompleteFromInputs({ utcDate: '2026-05-10', completions, hasParagraphForDate: false }),
    false,
  );
});

test('isUtcDayCompleteFromInputs: invalid date string → false', () => {
  assert.equal(
    isUtcDayCompleteFromInputs({
      utcDate: 'not-a-date',
      completions: {},
      hasParagraphForDate: true,
    }),
    false,
  );
});
