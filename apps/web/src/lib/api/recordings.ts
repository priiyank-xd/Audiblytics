import { getApiBaseUrl } from '@/lib/api/client';
import {
  apiRecordingResponseSchema,
  recordingListItemSchema,
  type RecordingListItem,
} from '@/lib/schemas/recording.schema';
import { err, ok, type Result } from '@/lib/result';
import type { StorageError } from '@/lib/storage/db';

type ApiErrorDetail = {
  kind?: string;
  message?: string;
};

function parseApiErrorBody(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') return undefined;
  const record = body as { detail?: { error?: ApiErrorDetail }; error?: ApiErrorDetail };
  return record.detail?.error?.message ?? record.error?.message;
}

function mapHttpToStorageError(response: Response, body: unknown): StorageError {
  const message = parseApiErrorBody(body) ?? response.statusText ?? 'Recording upload failed.';
  if (response.status === 507 || message.toLowerCase().includes('quota')) {
    return { kind: 'quota_exceeded', message };
  }
  return { kind: 'unknown', message };
}

function mapRecordingResponseResult(raw: unknown): Result<RecordingListItem, StorageError> {
  if (!raw || typeof raw !== 'object') {
    return err({ kind: 'unknown', message: 'Recording response was invalid.' });
  }
  const record = raw as Record<string, unknown>;
  const apiParsed = apiRecordingResponseSchema.safeParse({
    id: record.id,
    recordingDate: record.recordingDate,
    paragraphId: record.paragraphId,
    durationMs: record.durationMs,
    mimeType: record.mimeType,
    dayOfUse: record.dayOfUse,
    storageKey: record.storageKey,
  });
  if (!apiParsed.success) {
    return err({ kind: 'unknown', message: 'Recording response failed validation.' });
  }
  const itemParsed = recordingListItemSchema.safeParse({
    id: apiParsed.data.id,
    recordingDate: apiParsed.data.recordingDate,
    paragraphId: apiParsed.data.paragraphId,
    durationMs: apiParsed.data.durationMs,
    mimeType: apiParsed.data.mimeType,
    dayOfUse: apiParsed.data.dayOfUse,
  });
  if (!itemParsed.success) {
    return err({ kind: 'unknown', message: 'Recording response failed validation.' });
  }
  return ok(itemParsed.data);
}

function mapRecordingResponse(raw: Record<string, unknown>): RecordingListItem {
  const mapped = mapRecordingResponseResult(raw);
  if (!mapped.ok) {
    throw new Error(mapped.error.message);
  }
  return mapped.value;
}

function mapNetworkError(error: unknown): StorageError {
  const message = error instanceof Error ? error.message : 'Recording upload failed.';
  return { kind: 'unknown', message };
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function fetchRecordings(): Promise<RecordingListItem[]> {
  const base = getApiBaseUrl();
  const response = await fetch(`${base}/api/v1/recordings`, { credentials: 'include' });
  if (!response.ok) {
    const body = await readJson(response);
    throw new Error(parseApiErrorBody(body) ?? response.statusText);
  }
  const raw = (await response.json()) as Record<string, unknown>[];
  return raw.map((row) => mapRecordingResponse(row));
}

export async function fetchRecordingPlaybackUrl(recordingId: string): Promise<string> {
  const base = getApiBaseUrl();
  const response = await fetch(`${base}/api/v1/recordings/${recordingId}/playback-url`, {
    credentials: 'include',
  });
  if (!response.ok) {
    const body = await readJson(response);
    throw new Error(parseApiErrorBody(body) ?? response.statusText);
  }
  const raw = (await response.json()) as { playbackUrl?: string };
  if (typeof raw.playbackUrl !== 'string' || raw.playbackUrl.length === 0) {
    throw new Error('Playback URL missing from API response.');
  }
  return raw.playbackUrl;
}

export type SaveRecordingApiInput = {
  rowId: string;
  blob: Blob;
  mimeType: string;
  durationMs: number;
  paragraphId: string;
  recordingDate: string;
  dayOfUse: number;
};

export async function saveRecordingViaApi(
  input: SaveRecordingApiInput,
): Promise<Result<RecordingListItem & { blob: Blob }, StorageError>> {
  try {
    const base = getApiBaseUrl();
    const startResponse = await fetch(`${base}/api/v1/recordings`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: input.rowId,
        recordingDate: input.recordingDate,
        paragraphId: input.paragraphId,
        durationMs: input.durationMs,
        mimeType: input.mimeType,
        dayOfUse: input.dayOfUse,
      }),
    });
    const startBody = await readJson(startResponse);
    if (!startResponse.ok) {
      return err(mapHttpToStorageError(startResponse, startBody));
    }

    const startRaw = startBody as { uploadUrl?: string; recordingId?: string };
    if (typeof startRaw.uploadUrl !== 'string' || startRaw.uploadUrl.length === 0) {
      return err({ kind: 'unknown', message: 'Upload URL missing from API response.' });
    }

    const contentType = input.mimeType.split(';', 1)[0]?.trim().toLowerCase() ?? input.mimeType;
    const putResponse = await fetch(startRaw.uploadUrl, {
      method: 'PUT',
      body: input.blob,
      headers: { 'Content-Type': contentType },
    });
    if (!putResponse.ok) {
      return err({
        kind: 'unknown',
        message: `Upload to storage failed (${putResponse.status}).`,
      });
    }

    const completeResponse = await fetch(`${base}/api/v1/recordings/${input.rowId}/complete`, {
      method: 'POST',
      credentials: 'include',
    });
    const completeBody = await readJson(completeResponse);
    if (!completeResponse.ok) {
      return err(mapHttpToStorageError(completeResponse, completeBody));
    }

    const mapped = mapRecordingResponseResult(completeBody);
    if (!mapped.ok) {
      return mapped;
    }
    return ok({ ...mapped.value, blob: input.blob });
  } catch (error) {
    return err(mapNetworkError(error));
  }
}
