import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildTrailingUtcDateWindow } from '@/features/calendar/build-trailing-utc-date-window';

test('buildTrailingUtcDateWindow: 30 days ends on anchor UTC date', () => {
  const anchor = new Date('2026-05-10T18:30:00.000Z');
  const dates = buildTrailingUtcDateWindow(anchor, 30);
  assert.equal(dates.length, 30);
  assert.equal(dates[0], '2026-04-11');
  assert.equal(dates[29], '2026-05-10');
});

test('buildTrailingUtcDateWindow: 90-day window spot-check', () => {
  const anchor = new Date('2026-01-03T00:00:00.000Z');
  const d90 = buildTrailingUtcDateWindow(anchor, 90);
  assert.equal(d90.length, 90);
  assert.equal(d90[89], '2026-01-03');
  assert.equal(d90[0], '2025-10-06');
});
