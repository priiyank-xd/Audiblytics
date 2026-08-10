import { apiFetch, getApiBaseUrl } from '@/lib/api/client';

export type AccountDeletionResult = {
  deletedRecordings: number;
  orphanedObjectKeys: string[];
};

export type AccountExport = {
  filename: string;
  blob: Blob;
};

const FILENAME_FROM_DISPOSITION = /filename="([^"]+)"/;

/** Story 16.3 — GET /export returns a ZIP, so this bypasses the JSON `apiFetch`. */
export async function fetchAccountExport(): Promise<AccountExport> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/export`, { credentials: 'include' });
  if (!response.ok) {
    throw new Error('Export failed. Check that you are signed in and try again.');
  }
  const disposition = response.headers.get('content-disposition') ?? '';
  const matched = FILENAME_FROM_DISPOSITION.exec(disposition);
  return {
    filename: matched?.[1] ?? 'audiblytics-export.zip',
    blob: await response.blob(),
  };
}

/** Story 16.4 — removes every row and R2 object, and invalidates the session server-side. */
export async function deleteAccount(): Promise<AccountDeletionResult> {
  return apiFetch<AccountDeletionResult>('/api/v1/auth/account', { method: 'DELETE' });
}
