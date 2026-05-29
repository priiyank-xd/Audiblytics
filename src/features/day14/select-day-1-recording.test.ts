import assert from 'node:assert/strict';
import test from 'node:test';

import { pickSameWordPair } from '@/features/day14/select-day-1-recording';
import type { RecordingWithTheme } from '@/features/voice-journal/use-recordings';

function row(
  partial: Omit<RecordingWithTheme, 'themeLabel' | 'ttsFallbackWord'> &
    Pick<
      RecordingWithTheme,
      'id' | 'recordingDate' | 'paragraphId' | 'durationMs' | 'mimeType' | 'blob' | 'dayOfUse'
    >,
): RecordingWithTheme {
  return {
    ...partial,
    themeLabel: 'Horror',
    ttsFallbackWord: 'one',
  };
}

test('pickSameWordPair: prefers most recent B when multiple day-1 rows match', () => {
  const aEarly = row({
    id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
    recordingDate: '2026-01-01T10:00:00.000Z',
    paragraphId: 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',
    durationMs: 1000,
    mimeType: 'audio/webm',
    blob: new Blob(),
    dayOfUse: 1,
  });
  const aLate = row({
    id: 'cccccccc-cccc-4ccc-cccc-cccccccccccc',
    recordingDate: '2026-01-02T10:00:00.000Z',
    paragraphId: 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',
    durationMs: 1000,
    mimeType: 'audio/webm',
    blob: new Blob(),
    dayOfUse: 1,
  });
  const bMid = row({
    id: '11111111-1111-4111-8111-111111111111',
    recordingDate: '2026-02-01T10:00:00.000Z',
    paragraphId: 'dddddddd-dddd-4ddd-dddd-dddddddddddd',
    durationMs: 1000,
    mimeType: 'audio/webm',
    blob: new Blob(),
    dayOfUse: 5,
  });
  const bOlder = row({
    id: '22222222-2222-4222-8222-222222222222',
    recordingDate: '2026-03-01T10:00:00.000Z',
    paragraphId: 'eeeeeeee-eeee-4eee-eeee-eeeeeeeeeeee',
    durationMs: 1000,
    mimeType: 'audio/webm',
    blob: new Blob(),
    dayOfUse: 8,
  });
  const bNewest = row({
    id: '33333333-3333-4333-8333-333333333333',
    recordingDate: '2026-04-01T10:00:00.000Z',
    paragraphId: 'ffffffff-ffff-4fff-ffff-ffffffffffff',
    durationMs: 1000,
    mimeType: 'audio/webm',
    blob: new Blob(),
    dayOfUse: 10,
  });
  const wordSets = new Map<string, Set<string>>([
    [aEarly.paragraphId, new Set(['vehement'])],
    [bMid.paragraphId, new Set(['vehement'])],
    [bOlder.paragraphId, new Set(['other'])],
    [bNewest.paragraphId, new Set(['vehement'])],
  ]);
  const got = pickSameWordPair([aEarly, aLate], [aEarly, aLate, bMid, bOlder, bNewest], wordSets);
  assert(got);
  assert.equal(got.b.id, bNewest.id);
});

test('pickSameWordPair: returns null when no intersecting hard words', () => {
  const a = row({
    id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
    recordingDate: '2026-01-01T10:00:00.000Z',
    paragraphId: 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',
    durationMs: 1000,
    mimeType: 'audio/webm',
    blob: new Blob(),
    dayOfUse: 1,
  });
  const b = row({
    id: '11111111-1111-4111-8111-111111111111',
    recordingDate: '2026-02-01T10:00:00.000Z',
    paragraphId: 'cccccccc-cccc-4ccc-cccc-cccccccccccc',
    durationMs: 1000,
    mimeType: 'audio/webm',
    blob: new Blob(),
    dayOfUse: 2,
  });
  const wordSets = new Map<string, Set<string>>([
    [a.paragraphId, new Set(['alpha'])],
    [b.paragraphId, new Set(['beta'])],
  ]);
  assert.equal(pickSameWordPair([a], [a, b], wordSets), null);
});
