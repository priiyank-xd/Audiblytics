import assert from 'node:assert/strict';
import test from 'node:test';

import type { OfflinePackEntry } from '@/lib/schemas/offline-pack.schema';
import { ROLLING_WINDOW_MS, pickFromOfflinePackRowsInMemory } from '@/features/offline-pack/select-from-offline-pack';

function hardWord(id: string) {
  return {
    word: id,
    ipa: '/ipa/',
    pronunciationGuide: id.toUpperCase(),
    meaning: 'meaning',
    exampleSentence: 'example',
  };
}

function row(args: {
  id: string;
  theme: string;
  persona: string;
  lastSurfacedAt: string | null;
}): OfflinePackEntry {
  return {
    id: args.id,
    theme: args.theme,
    persona: args.persona,
    lastSurfacedAt: args.lastSurfacedAt,
    paragraph: `paragraph-${args.id}`,
    hardWords: [hardWord(args.id)],
  };
}

const NOW = new Date('2026-05-15T00:00:00.000Z');

test('pickFromOfflinePackRowsInMemory: eligible picks uniformly via injected RNG', () => {
  const cutoffMs = NOW.getTime() - ROLLING_WINDOW_MS;
  const rows: OfflinePackEntry[] = [
    row({ id: '00000000-0000-0000-0000-000000000001', theme: 'horror', persona: 'gre-aspirant', lastSurfacedAt: null }),
    row({
      id: '00000000-0000-0000-0000-000000000002',
      theme: 'horror',
      persona: 'gre-aspirant',
      lastSurfacedAt: new Date(cutoffMs - 1234).toISOString(),
    }),
  ];

  const picked = pickFromOfflinePackRowsInMemory({
    rows,
    now: NOW,
    randomIndex: () => 1,
  });

  assert.equal(picked?.id, rows[1]!.id);
});

test('pickFromOfflinePackRowsInMemory: eligible empty falls back to oldest surfaced', () => {
  const cutoffMs = NOW.getTime() - ROLLING_WINDOW_MS;
  const rows: OfflinePackEntry[] = [
    // Within rolling window (not strictly older)
    row({
      id: '00000000-0000-0000-0000-000000000010',
      theme: 'adventure',
      persona: 'storyteller',
      lastSurfacedAt: new Date(cutoffMs + 10_000).toISOString(),
    }),
    row({
      id: '00000000-0000-0000-0000-000000000011',
      theme: 'adventure',
      persona: 'storyteller',
      lastSurfacedAt: new Date(cutoffMs + 20_000).toISOString(),
    }),
  ];

  // eligible is empty, so fallback selects minimum lastSurfacedAt (oldest)
  const picked = pickFromOfflinePackRowsInMemory({ rows, now: NOW, randomIndex: () => 0 });
  assert.equal(picked?.id, rows[0]!.id);
});

test('pickFromOfflinePackRowsInMemory: n=1 pack selects it when eligible empty', () => {
  const cutoffMs = NOW.getTime() - ROLLING_WINDOW_MS;
  const rows: OfflinePackEntry[] = [
    row({
      id: '00000000-0000-0000-0000-000000000021',
      theme: 'mystery',
      persona: 'business-english',
      lastSurfacedAt: new Date(cutoffMs + 1).toISOString(),
    }),
  ];

  const picked = pickFromOfflinePackRowsInMemory({ rows, now: NOW, randomIndex: () => 0 });
  assert.equal(picked?.id, rows[0]!.id);
});

test('pickFromOfflinePackRowsInMemory: deterministic tie-break by id', () => {
  const cutoffMs = NOW.getTime() - ROLLING_WINDOW_MS;
  const surfacedAt = new Date(cutoffMs + 5_000).toISOString();

  const rows: OfflinePackEntry[] = [
    row({
      id: '00000000-0000-0000-0000-000000000030',
      theme: 'comedy',
      persona: 'casual-conversationalist',
      lastSurfacedAt: surfacedAt,
    }),
    row({
      id: '00000000-0000-0000-0000-000000000029',
      theme: 'comedy',
      persona: 'casual-conversationalist',
      lastSurfacedAt: surfacedAt,
    }),
  ];

  const picked = pickFromOfflinePackRowsInMemory({ rows, now: NOW });
  assert.equal(picked?.id, rows[1]!.id);
});

test('pickFromOfflinePackRowsInMemory: empty input returns null', () => {
  const picked = pickFromOfflinePackRowsInMemory({ rows: [], now: NOW });
  assert.equal(picked, null);
});
