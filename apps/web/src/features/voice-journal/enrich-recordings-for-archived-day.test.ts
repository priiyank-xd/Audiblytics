import assert from 'node:assert/strict';
import { test } from 'node:test';

import { enrichRecordingsForArchivedDay } from '@/features/voice-journal/enrich-recordings-with-theme';
import type { CachedParagraph } from '@/lib/schemas/paragraph-cache.schema';
import type { RecordingListItem } from '@/lib/schemas/recording.schema';

const recording: RecordingListItem = {
  id: '11111111-1111-4111-8111-111111111111',
  recordingDate: '2026-05-31T12:00:00.000Z',
  paragraphId: '22222222-2222-4222-8222-222222222222',
  durationMs: 1000,
  mimeType: 'audio/webm',
  dayOfUse: 1,
};

const cached: CachedParagraph = {
  id: '22222222-2222-4222-8222-222222222222',
  paragraph: 'Text',
  hardWords: [
    {
      word: 'arboreal',
      ipa: '/ɑː/',
      pronunciationGuide: 'ar',
      meaning: 'm',
      exampleSentence: 'e',
    },
  ],
  theme: 'adventure',
  persona: 'explorer',
  generatedAt: '2026-05-31T12:00:00.000Z',
};

test('enrichRecordingsForArchivedDay: uses paragraph theme', () => {
  const rows = enrichRecordingsForArchivedDay([recording], cached);
  assert.equal(rows[0]?.themeLabel, 'Adventure');
  assert.equal(rows[0]?.ttsFallbackWord, 'arboreal');
});

test('enrichRecordingsForArchivedDay: null paragraph → Unknown theme', () => {
  const rows = enrichRecordingsForArchivedDay([recording], null);
  assert.equal(rows[0]?.themeLabel, 'Unknown');
});
