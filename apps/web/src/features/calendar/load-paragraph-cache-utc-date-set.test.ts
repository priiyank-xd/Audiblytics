import assert from 'node:assert/strict';
import { test } from 'node:test';

import { mergeParagraphUtcDateSets } from '@/features/calendar/load-paragraph-cache-utc-date-set';

test('mergeParagraphUtcDateSets: unions multiple sources', () => {
  const merged = mergeParagraphUtcDateSets(
    new Set(['2026-05-30']),
    ['2026-05-31', '2026-05-30'],
  );
  assert.equal(merged.size, 2);
  assert.equal(merged.has('2026-05-30'), true);
  assert.equal(merged.has('2026-05-31'), true);
});
