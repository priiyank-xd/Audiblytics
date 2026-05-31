import { getApiBaseUrl } from '@/lib/api/client';
import {
  completionsSchema,
  dayCompletionSchema,
  type Completions,
  type DayCompletion,
} from '@/lib/schemas/completions.schema';
import { err, ok, type Result } from '@/lib/result';
import type { StorageError } from '@/lib/storage/db';

type ApiErrorDetail = {
  kind?: string;
  message?: string;
};

export type DayCompletionPatch = Partial<Pick<DayCompletion, 'hasReadIt' | 'hasRecording' | 'usedOfflinePack'>>;

function parseApiErrorBody(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') return undefined;
  const record = body as { detail?: { error?: ApiErrorDetail }; error?: ApiErrorDetail };
  return record.detail?.error?.message ?? record.error?.message;
}

function mapHttpToStorageError(response: Response, body: unknown): StorageError {
  const message = parseApiErrorBody(body) ?? response.statusText ?? 'Completions request failed.';
  return { kind: 'unknown', message };
}

function mapNetworkError(error: unknown): StorageError {
  const message = error instanceof Error ? error.message : 'Completions request failed.';
  return { kind: 'unknown', message };
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function fetchCompletions(): Promise<Completions> {
  const base = getApiBaseUrl();
  const response = await fetch(`${base}/api/v1/completions`, { credentials: 'include' });
  if (!response.ok) {
    const body = await readJson(response);
    throw new Error(parseApiErrorBody(body) ?? response.statusText);
  }
  const raw = await response.json();
  const parsed = completionsSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error('Completions response failed validation.');
  }
  return parsed.data;
}

export async function upsertDayCompletion(
  utcDate: string,
  patch: DayCompletionPatch,
): Promise<Result<DayCompletion, StorageError>> {
  try {
    const base = getApiBaseUrl();
    const response = await fetch(`${base}/api/v1/completions/${utcDate}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    const body = await readJson(response);
    if (!response.ok) {
      return err(mapHttpToStorageError(response, body));
    }
    if (!body || typeof body !== 'object') {
      return err({ kind: 'unknown', message: 'Completion response was invalid.' });
    }
    const record = body as Record<string, unknown>;
    const parsed = dayCompletionSchema.safeParse({
      hasReadIt: record.hasReadIt,
      hasRecording: record.hasRecording,
      usedOfflinePack: record.usedOfflinePack,
    });
    if (!parsed.success) {
      return err({ kind: 'unknown', message: 'Completion response failed validation.' });
    }
    return ok(parsed.data);
  } catch (error) {
    return err(mapNetworkError(error));
  }
}
