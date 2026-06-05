import assert from 'node:assert/strict';
import { test } from 'node:test';

import { formatLastPracticedLabel } from '@/lib/collection/format-last-practiced';

test('formatLastPracticedLabel: not yet', () => {
  assert.equal(formatLastPracticedLabel(null), 'Not yet');
});

test('formatLastPracticedLabel: today and relative', () => {
  const ref = new Date('2026-05-31T15:00:00.000Z');
  assert.equal(formatLastPracticedLabel('2026-05-31T08:00:00.000Z', ref), 'Today');
  assert.equal(formatLastPracticedLabel('2026-05-29T08:00:00.000Z', ref), '2 days ago');
});
