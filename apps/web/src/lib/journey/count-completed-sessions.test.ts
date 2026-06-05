import assert from 'node:assert/strict';
import { test } from 'node:test';

import { countCompletedSessions } from '@/lib/journey/count-completed-sessions';
import { buildTimelineEntries } from '@/lib/journey/build-timeline-entries';
import { journeyReflectionsSchema } from '@/lib/schemas/journey-reflections.schema';

test('countCompletedSessions: requires paragraph + engagement', () => {
  const count = countCompletedSessions({
    completions: {
      '2026-05-01': { hasReadIt: true, hasRecording: false, usedOfflinePack: false },
    },
    paragraphDates: new Set(['2026-05-01']),
    todayUtc: '2026-05-31',
    hasParagraphForTodayOnScreen: false,
  });
  assert.equal(count, 1);
});

test('countCompletedSessions: paragraph without engagement does not count', () => {
  const count = countCompletedSessions({
    completions: {
      '2026-05-01': { hasReadIt: false, hasRecording: false, usedOfflinePack: false },
    },
    paragraphDates: new Set(['2026-05-01']),
    todayUtc: '2026-05-31',
    hasParagraphForTodayOnScreen: false,
  });
  assert.equal(count, 0);
});

test('buildTimelineEntries: filters incomplete and sorts desc', () => {
  const entries = buildTimelineEntries([
    { utcDate: '2026-05-01', complete: true, usedOfflinePack: false },
    { utcDate: '2026-05-02', complete: false, usedOfflinePack: false },
    { utcDate: '2026-05-03', complete: true, usedOfflinePack: true },
  ]);
  assert.equal(entries.length, 2);
  assert.equal(entries[0]?.utcDate, '2026-05-03');
  assert.equal(entries[1]?.utcDate, '2026-05-01');
  assert.equal(entries[0]?.usedOfflinePack, true);
});

test('journeyReflectionsSchema: defaults empty map', () => {
  const parsed = journeyReflectionsSchema.parse({});
  assert.deepEqual(parsed.notesByUtcDate, {});
});
