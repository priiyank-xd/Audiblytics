import assert from 'node:assert/strict';
import { test } from 'node:test';

import { longestStreakFromCompletedDates } from '@/lib/day-counter/longest-streak';

test('longestStreakFromCompletedDates: empty → 0', () => {
  assert.equal(longestStreakFromCompletedDates([]), 0);
});

test('longestStreakFromCompletedDates: single day → 1', () => {
  assert.equal(longestStreakFromCompletedDates(['2026-05-01']), 1);
});

test('longestStreakFromCompletedDates: consecutive run', () => {
  assert.equal(
    longestStreakFromCompletedDates(['2026-05-01', '2026-05-02', '2026-05-03']),
    3,
  );
});

test('longestStreakFromCompletedDates: gap resets run', () => {
  assert.equal(
    longestStreakFromCompletedDates([
      '2026-05-01',
      '2026-05-02',
      '2026-05-04',
      '2026-05-05',
    ]),
    2,
  );
});
