import { db, safeWrite, type StorageError } from '@/lib/storage/db';
import { ok, type Result } from '@/lib/result';

const ROLLING_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;

/**
 * Deletes voice journal rows older than the rolling 90-day window (UTC).
 * Idempotent: a second run removes nothing until new rows age past the cutoff.
 */
export async function pruneRecordingsOlderThanRollingWindow(): Promise<
  Result<{ deletedCount: number }, StorageError>
> {
  const cutoffIso = new Date(Date.now() - ROLLING_RETENTION_MS).toISOString();
  const write = await safeWrite(() => db.recordings.where('recordingDate').below(cutoffIso).delete());
  if (!write.ok) return write;
  return ok({ deletedCount: write.value });
}
