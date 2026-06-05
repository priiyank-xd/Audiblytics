import assert from 'node:assert/strict';
import { test } from 'node:test';

import { filterRecordingsForUtcDate } from '@/lib/voice-journal/filter-recordings-for-utc-date';
import type { RecordingListItem } from '@/lib/schemas/recording.schema';

const base: RecordingListItem = {
  id: '11111111-1111-4111-8111-111111111111',
  recordingDate: '2026-05-31T14:00:00.000Z',
  paragraphId: '22222222-2222-4222-8222-222222222222',
  durationMs: 1000,
  mimeType: 'audio/webm',
  dayOfUse: 1,
};

test('filterRecordingsForUtcDate: keeps matching UTC day only', () => {
  const rows = [
    base,
    { ...base, id: '33333333-3333-4333-8333-333333333333', recordingDate: '2026-06-01T01:00:00.000Z' },
  ];
  const filtered = filterRecordingsForUtcDate(rows, '2026-05-31');
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0]?.id, base.id);
});
