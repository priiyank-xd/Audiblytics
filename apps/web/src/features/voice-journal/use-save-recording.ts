import { dayOfUseAtRecordingSave, recordDayOfUse } from '@/lib/day-counter/index';
import { formatUtcDate } from '@/lib/day-counter/format-utc-date';
import { saveRecordingViaApi } from '@/lib/api/recordings';
import { isApiStorageBackend } from '@/lib/config/storage-backend';
import { err, ok, type Result } from '@/lib/result';
import { dayCompletionSchema } from '@/lib/schemas/completions.schema';
import { recordingSchema, type VoiceRecording } from '@/lib/schemas/recording.schema';
import { db, safeWrite, type StorageError } from '@/lib/storage/db';
import { readCompletions, writeCompletions } from '@/lib/storage/use-local-storage';

import { notifyRecordingsMutated } from '@/features/voice-journal/recordings-mutated';

export type SaveRecordingInput = {
  /** Stable UUID for this take — must match between retries after a failed write. */
  rowId: string;
  blob: Blob;
  mimeType: string;
  durationMs: number;
  paragraphId: string;
};

function stampCompletionsAndDayOfUse(): void {
  const todayUtc = formatUtcDate();
  const completions = readCompletions();
  const prev = completions[todayUtc] ?? dayCompletionSchema.parse({});
  const merged = dayCompletionSchema.parse({
    ...prev,
    hasRecording: true,
  });
  writeCompletions({ ...completions, [todayUtc]: merged });
  recordDayOfUse();
}

/**
 * Validates and persists a voice-journal take, stamps `dayOfUse` via `dayOfUseAtRecordingSave`
 * (before `recordDayOfUse`), updates completions,
 * then calls `recordDayOfUse()` (idempotent per UTC day).
 */
export async function saveRecording(input: SaveRecordingInput): Promise<Result<VoiceRecording, StorageError>> {
  const dayOfUseSnapshot = dayOfUseAtRecordingSave();
  const recordingDate = new Date().toISOString();

  const candidate: VoiceRecording = {
    id: input.rowId,
    recordingDate,
    paragraphId: input.paragraphId,
    durationMs: input.durationMs,
    mimeType: input.mimeType,
    blob: input.blob,
    dayOfUse: dayOfUseSnapshot,
  };

  const parsed = recordingSchema.safeParse(candidate);
  if (!parsed.success) {
    console.warn('[voice-journal] recording schema validation failed', parsed.error.issues);
    return err({ kind: 'unknown', message: 'Recording could not be validated for storage.' });
  }

  if (isApiStorageBackend()) {
    const apiResult = await saveRecordingViaApi({
      rowId: input.rowId,
      blob: input.blob,
      mimeType: input.mimeType,
      durationMs: input.durationMs,
      paragraphId: input.paragraphId,
      recordingDate,
      dayOfUse: dayOfUseSnapshot,
    });
    if (!apiResult.ok) {
      return err(apiResult.error);
    }
    stampCompletionsAndDayOfUse();
    notifyRecordingsMutated();
    return ok(parsed.data);
  }

  const write = await safeWrite(() => db.recordings.put(parsed.data));
  if (!write.ok) {
    return write;
  }

  stampCompletionsAndDayOfUse();

  return ok(parsed.data);
}
