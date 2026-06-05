import assert from 'node:assert/strict';
import { test } from 'node:test';

import { distinctDaysFromMerged, mergeDaysOfUse } from '@/lib/day-counter/merge-days-of-use';

test('mergeDaysOfUse: unions without duplicates', () => {
  const merged = mergeDaysOfUse(['2026-05-01', '2026-05-02'], ['2026-05-02', '2026-05-03']);
  assert.equal(merged.length, 3);
});

test('distinctDaysFromMerged: counts union', () => {
  assert.equal(
    distinctDaysFromMerged(['2026-05-01'], ['2026-05-01', '2026-05-02']),
    2,
  );
});
