import { getApiBaseUrl } from '@/lib/api/client';
import { collectionWordSchema, type CollectionWord } from '@/lib/schemas/collection.schema';
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
  const message = parseApiErrorBody(body) ?? response.statusText ?? 'Collection request failed.';
  if (response.status === 507 || message.toLowerCase().includes('quota')) {
    return { kind: 'quota_exceeded', message };
  }
  return { kind: 'unknown', message };
}

function mapNetworkError(error: unknown): StorageError {
  const message = error instanceof Error ? error.message : 'Collection request failed.';
  return { kind: 'unknown', message };
}

function mapCollectionWordResult(raw: unknown): Result<CollectionWord, StorageError> {
  const parsed = collectionWordSchema.safeParse(raw);
  if (!parsed.success) {
    return err({ kind: 'unknown', message: 'Collection response failed validation.' });
  }
  return ok(parsed.data);
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function fetchCollection(): Promise<CollectionWord[]> {
  const base = getApiBaseUrl();
  const response = await fetch(`${base}/api/v1/collection`, { credentials: 'include' });
  if (!response.ok) {
    const body = await readJson(response);
    throw new Error(parseApiErrorBody(body) ?? response.statusText);
  }
  const raw = (await response.json()) as unknown[];
  const words: CollectionWord[] = [];
  for (const row of raw) {
    const mapped = mapCollectionWordResult(row);
    if (!mapped.ok) {
      throw new Error(mapped.error.message);
    }
    words.push(mapped.value);
  }
  return words;
}

export async function saveCollectionWord(
  word: CollectionWord,
): Promise<Result<CollectionWord, StorageError>> {
  try {
    const base = getApiBaseUrl();
    const response = await fetch(`${base}/api/v1/collection`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(word),
    });
    const body = await readJson(response);
    if (!response.ok) {
      return err(mapHttpToStorageError(response, body));
    }
    return mapCollectionWordResult(body);
  } catch (error) {
    return err(mapNetworkError(error));
  }
}

export async function deleteCollectionWord(id: string): Promise<Result<void, StorageError>> {
  try {
    const base = getApiBaseUrl();
    const response = await fetch(`${base}/api/v1/collection/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (response.status === 204) {
      return ok(undefined);
    }
    const body = await readJson(response);
    return err(mapHttpToStorageError(response, body));
  } catch (error) {
    return err(mapNetworkError(error));
  }
}
