import Dexie, { type Table } from 'dexie';
import type { ZodTypeAny } from 'zod';

import { collectionWordSchema, type CollectionWord } from '@/lib/schemas/collection.schema';
import { recordingSchema, type VoiceRecording } from '@/lib/schemas/recording.schema';
import { cachedParagraphSchema, type CachedParagraph } from '@/lib/schemas/paragraph-cache.schema';
import { offlinePackEntrySchema, type OfflinePackEntry } from '@/lib/schemas/offline-pack.schema';
import { err, ok, type Result } from '@/lib/result';

/**
 * Discriminated-union storage error type. Returned by `safeWrite` when a Dexie
 * write fails. Renders via `<InlineErrorSurface variant="storage" />` per AR25.
 */
export type StorageError =
  | { kind: 'quota_exceeded'; message: string }
  | { kind: 'access_denied'; message: string }
  | { kind: 'unknown'; message: string };

export class AudiblyticsDB extends Dexie {
  collection!: Table<CollectionWord, string>;
  recordings!: Table<VoiceRecording, string>;
  paragraphCache!: Table<CachedParagraph, string>;
  offlinePack!: Table<OfflinePackEntry, string>;

  constructor() {
    super('audiblytics');
    this.version(1).stores({
      collection: '++id, savedAt, lastReviewedAt, word',
      recordings: '++id, recordingDate, paragraphId, dayOfUse',
      paragraphCache: '++id, generatedAt, theme, persona',
      offlinePack: '++id, theme, persona, lastSurfacedAt',
    });
    // v1 used ++id for recordings while `recording.schema` requires string UUID `id`.
    // Dexie cannot change a store's primary key in-place — drop then recreate (two versions).
    this.version(2).stores({
      collection: '++id, savedAt, lastReviewedAt, word',
      recordings: null,
      paragraphCache: '++id, generatedAt, theme, persona',
      offlinePack: '++id, theme, persona, lastSurfacedAt',
    });
    this.version(3).stores({
      collection: '++id, savedAt, lastReviewedAt, word',
      recordings: 'id, recordingDate, paragraphId, dayOfUse',
      paragraphCache: '++id, generatedAt, theme, persona',
      offlinePack: '++id, theme, persona, lastSurfacedAt',
    });
  }
}

/** Singleton Dexie instance. Import from anywhere — there is exactly one DB connection per tab. */
export const db = new AudiblyticsDB();

/**
 * Wraps a Dexie write in try/catch and returns Result<T, StorageError>.
 * Logs the underlying error via console.error before returning err (AC12 — never silent).
 */
export async function safeWrite<T>(fn: () => Promise<T>): Promise<Result<T, StorageError>> {
  try {
    return ok(await fn());
  } catch (e) {
    const error = normalizeStorageError(e);
    console.error('[storage] write failed:', error.kind, error.message, e);
    return err(error);
  }
}

function normalizeStorageError(e: unknown): StorageError {
  const name = e instanceof Error ? e.name : '';

  if (e instanceof DOMException) {
    if (e.name === 'QuotaExceededError') {
      return { kind: 'quota_exceeded', message: e.message };
    }
    if (e.name === 'NotAllowedError' || e.name === 'SecurityError') {
      return { kind: 'access_denied', message: e.message };
    }
  }

  if (name === 'QuotaExceededError') {
    return {
      kind: 'quota_exceeded',
      message: e instanceof Error ? e.message : String(e),
    };
  }
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return {
      kind: 'access_denied',
      message: e instanceof Error ? e.message : String(e),
    };
  }

  const message = e instanceof Error ? e.message : String(e);
  return { kind: 'unknown', message };
}

/**
 * Validates persisted records against their Zod schemas at app load.
 * Logs (does not throw) any validation failures so a single corrupted row does
 * not brick app boot. Per AR17 + architecture validation timing.
 */
export async function verifyOnLoad(): Promise<void> {
  const checks: Array<readonly [string, Table<unknown, string>, ZodTypeAny]> = [
    ['collection', db.collection as unknown as Table<unknown, string>, collectionWordSchema],
    ['recordings', db.recordings as unknown as Table<unknown, string>, recordingSchema],
    ['paragraphCache', db.paragraphCache as unknown as Table<unknown, string>, cachedParagraphSchema],
    ['offlinePack', db.offlinePack as unknown as Table<unknown, string>, offlinePackEntrySchema],
  ] as const;

  for (const [name, table, schema] of checks) {
    try {
      const records = await table.toArray();
      for (const record of records) {
        const result = schema.safeParse(record);
        if (!result.success) {
          console.warn(
            `[storage] verifyOnLoad: drift in '${name}' table for record`,
            (record as { id?: unknown })?.id,
            result.error.issues,
          );
        }
      }
    } catch (e) {
      console.warn(`[storage] verifyOnLoad: '${name}' table read failed`, e);
    }
  }
}
