import { enrichRecordingsWithTheme } from '@/features/voice-journal/enrich-recordings-with-theme';
import type { RecordingWithTheme } from '@/features/voice-journal/use-recordings';
import { db } from '@/lib/storage/db';
import { isWarmupRecordingParagraphId } from '@/lib/warmup-recording-id';

export type Day14MatchKind = 'same-word' | 'fallback-earliest-latest';

export type Day14RecordingPair = {
  rowA: RecordingWithTheme;
  rowB: RecordingWithTheme;
  matchKind: Day14MatchKind;
};

export type SelectDay1RecordingResult =
  | { ok: true; value: Day14RecordingPair }
  | { ok: false; error: 'insufficient_recordings' };

/** Exported for unit tests (same-word matrix). */
export function normalizeHardWordForComparison(w: string): string {
  return w.trim().toLocaleLowerCase();
}

async function loadHardWordSetsByParagraphId(
  recordings: RecordingWithTheme[],
): Promise<Map<string, Set<string>>> {
  const ids = [
    ...new Set(
      recordings.map((r) => r.paragraphId).filter((id) => !isWarmupRecordingParagraphId(id)),
    ),
  ];
  const out = new Map<string, Set<string>>();
  await Promise.all(
    ids.map(async (id) => {
      const row = await db.paragraphCache.get(id);
      if (!row) {
        out.set(id, new Set());
        return;
      }
      out.set(id, new Set(row.hardWords.map((h) => normalizeHardWordForComparison(h.word))));
    }),
  );
  return out;
}

type Candidate = { a: RecordingWithTheme; b: RecordingWithTheme; bDate: string; aDate: string };

/** Exported for unit tests. */
export function pickSameWordPair(
  day1Recs: RecordingWithTheme[],
  rest: RecordingWithTheme[],
  wordSets: Map<string, Set<string>>,
): Candidate | null {
  const cands: Candidate[] = [];
  for (const a of day1Recs) {
    const setA = wordSets.get(a.paragraphId) ?? new Set();
    if (setA.size === 0) continue;
    for (const b of rest) {
      if (b.id === a.id) continue;
      const setB = wordSets.get(b.paragraphId) ?? new Set();
      let intersect = false;
      for (const w of setA) {
        if (setB.has(w)) {
          intersect = true;
          break;
        }
      }
      if (intersect) {
        cands.push({ a, b, bDate: b.recordingDate, aDate: a.recordingDate });
      }
    }
  }
  if (cands.length === 0) return null;
  cands.sort((c1, c2) => {
    const byB = c2.bDate.localeCompare(c1.bDate);
    if (byB !== 0) return byB;
    return c1.aDate.localeCompare(c2.aDate);
  });
  return cands[0] ?? null;
}

/**
 * Picks Day-1 vs recent comparison clips (FR38). Caller should only invoke when
 * `useDay14Trigger() === true` (Day-1 row exists); still returns `insufficient_recordings`
 * if data is missing.
 */
export async function selectDay1Recording(): Promise<SelectDay1RecordingResult> {
  const raw = await db.recordings.toArray();
  if (raw.length === 0) {
    return { ok: false, error: 'insufficient_recordings' };
  }

  const enriched = await enrichRecordingsWithTheme(raw);
  const byDate = [...enriched].sort((a, b) => a.recordingDate.localeCompare(b.recordingDate));
  const day1Recs = byDate.filter((r) => r.dayOfUse === 1);
  if (day1Recs.length === 0) {
    return { ok: false, error: 'insufficient_recordings' };
  }

  const wordSets = await loadHardWordSetsByParagraphId(enriched);
  const same = pickSameWordPair(day1Recs, enriched, wordSets);
  if (same) {
    return {
      ok: true,
      value: { rowA: same.a, rowB: same.b, matchKind: 'same-word' },
    };
  }

  const rowA = byDate[0]!;
  const rowB = byDate[byDate.length - 1]!;
  return {
    ok: true,
    value: { rowA, rowB, matchKind: 'fallback-earliest-latest' },
  };
}
