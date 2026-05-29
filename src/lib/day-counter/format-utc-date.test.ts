import assert from 'node:assert/strict';
import test from 'node:test';

import { formatUtcDate } from '@/lib/day-counter/format-utc-date';

test('formatUtcDate: uses UTC fields (not local)', () => {
  // Local midnight in US can be previous UTC day — anchor to explicit UTC instant.
  const d = new Date('2026-05-10T23:30:00.000Z');
  assert.equal(formatUtcDate(d), '2026-05-10');
});

test('formatUtcDate: rolls UTC calendar at Z boundary', () => {
  const d = new Date('2026-05-11T00:30:00.000Z');
  assert.equal(formatUtcDate(d), '2026-05-11');
});
