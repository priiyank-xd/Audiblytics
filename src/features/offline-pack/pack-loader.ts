import type { StorageError } from '@/lib/storage/db';
import { db, safeWrite } from '@/lib/storage/db';
import { err, type Result } from '@/lib/result';
import { offlinePackEntrySchema, type OfflinePackEntry } from '@/lib/schemas/offline-pack.schema';

type LoadOfflinePackResult = { inserted: number; skipped: number };

function toStorageError(message: string): StorageError {
  return { kind: 'unknown', message };
}

export async function loadOfflinePackFromPublic(): Promise<Result<LoadOfflinePackResult, StorageError>> {
  let response: Response;
  try {
    response = await fetch('/offline-pack.json', { cache: 'no-store' });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return err(toStorageError(`Failed to fetch /offline-pack.json: ${message}`));
  }

  if (!response.ok) {
    return err(
      toStorageError(`Failed to fetch /offline-pack.json: ${response.status} ${response.statusText}`),
    );
  }

  let parsedJson: unknown;
  try {
    parsedJson = await response.json();
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return err(toStorageError(`Failed to parse /offline-pack.json as JSON: ${message}`));
  }

  if (!Array.isArray(parsedJson)) {
    return err(toStorageError('offline-pack.json must be a top-level array of entries.'));
  }

  const entries: OfflinePackEntry[] = [];
  let skipped = 0;

  for (const [index, row] of parsedJson.entries()) {
    const validation = offlinePackEntrySchema.safeParse(row);
    if (!validation.success) {
      skipped += 1;
      console.warn('[offline-pack] skipping invalid row', { index, issues: validation.error.issues });
      continue;
    }

    entries.push(validation.data);
  }

  const loadResult: LoadOfflinePackResult = { inserted: entries.length, skipped };

  // Idempotent load: clear then insert.
  return safeWrite(async () => {
    await db.offlinePack.clear();
    if (entries.length > 0) {
      await db.offlinePack.bulkAdd(entries);
    }
    return loadResult;
  });
}

