import { ok, err, type Result } from '@/lib/result';
import { db } from '@/lib/storage/db';
import type { OfflinePackEntry } from '@/lib/schemas/offline-pack.schema';
import { type ParagraphResult } from '@/lib/llm/schemas/paragraph.schema';

export const ROLLING_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export type OfflinePackSelection = {
  id: string;
  theme: string;
  persona: string;
  paragraph: ParagraphResult;
};

export type OfflinePackError =
  | { kind: 'empty_pack'; message: string };

function toParagraphResult(row: OfflinePackEntry): ParagraphResult {
  return {
    paragraph: row.paragraph,
    hardWords: row.hardWords,
  };
}

function lastSurfacedAtMs(lastSurfacedAt: string | null): number {
  if (lastSurfacedAt === null) return Number.NEGATIVE_INFINITY;
  return new Date(lastSurfacedAt).getTime();
}

function pickOldestFallback(rows: OfflinePackEntry[]): OfflinePackEntry {
  // Deterministic tie-break: if timestamps are equal, pick lexicographically smallest id.
  let best = rows[0]!;
  let bestMs = lastSurfacedAtMs(best.lastSurfacedAt);

  for (const row of rows) {
    const rowMs = lastSurfacedAtMs(row.lastSurfacedAt);
    if (rowMs < bestMs) {
      best = row;
      bestMs = rowMs;
      continue;
    }
    if (rowMs === bestMs && row.id < best.id) {
      best = row;
    }
  }
  return best;
}

function defaultRandomIndex(maxExclusive: number): number {
  if (maxExclusive <= 0) return 0;

  // Prefer crypto for uniform-ish randomness.
  const c: Crypto | undefined =
    typeof globalThis !== 'undefined' && 'crypto' in globalThis ? (globalThis.crypto as Crypto) : undefined;
  if (c?.getRandomValues) {
    // Rejection sampling to avoid modulo bias.
    const maxUint32 = 2 ** 32;
    const limit = Math.floor(maxUint32 / maxExclusive) * maxExclusive;
    const arr = new Uint32Array(1);
    while (true) {
      c.getRandomValues(arr);
      const v = arr[0]!;
      if (v < limit) return v % maxExclusive;
    }
  }

  return Math.floor(Math.random() * maxExclusive);
}

export function pickFromOfflinePackRowsInMemory(args: {
  rows: OfflinePackEntry[];
  now: Date;
  randomIndex?: (maxExclusive: number) => number;
}): OfflinePackSelection | null {
  if (args.rows.length === 0) return null;

  const cutoffMs = args.now.getTime() - ROLLING_WINDOW_MS;
  const eligible = args.rows.filter((r) => {
    if (r.lastSurfacedAt === null) return true;
    const surfacedMs = new Date(r.lastSurfacedAt).getTime();
    return surfacedMs < cutoffMs;
  });

  const pick = (() => {
    if (eligible.length > 0) {
      const rand = args.randomIndex ?? defaultRandomIndex;
      return eligible[rand(eligible.length)]!;
    }
    return pickOldestFallback(args.rows);
  })();

  return {
    id: pick.id,
    theme: pick.theme,
    persona: pick.persona,
    paragraph: toParagraphResult(pick),
  };
}

export async function selectFromOfflinePack(now = new Date()): Promise<Result<OfflinePackSelection, OfflinePackError>> {
  const nowIso = now.toISOString();

  return db.transaction('rw', db.offlinePack, async () => {
    const rows = await db.offlinePack.toArray();
    const selection = pickFromOfflinePackRowsInMemory({ rows, now });
    if (!selection) {
      return err({ kind: 'empty_pack', message: 'Offline pack is empty.' });
    }

    // Best-effort re-read within transaction to avoid stale updates.
    const fresh = await db.offlinePack.get(selection.id);
    if (!fresh) {
      return err({ kind: 'empty_pack', message: 'Offline pack entry vanished during selection.' });
    }

    await db.offlinePack.update(selection.id, { lastSurfacedAt: nowIso });

    return ok({
      id: fresh.id,
      theme: fresh.theme,
      persona: fresh.persona,
      paragraph: toParagraphResult(fresh),
    });
  });
}

