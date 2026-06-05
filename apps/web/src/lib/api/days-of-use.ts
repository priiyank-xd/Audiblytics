import { getApiBaseUrl } from '@/lib/api/client';
import { daysOfUseSchema } from '@/lib/schemas/days-of-use.schema';

type ApiErrorDetail = {
  kind?: string;
  message?: string;
};

function parseApiErrorBody(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') return undefined;
  const record = body as { detail?: { error?: ApiErrorDetail }; error?: ApiErrorDetail };
  return record.detail?.error?.message ?? record.error?.message;
}

export async function fetchDaysOfUse(): Promise<string[]> {
  const base = getApiBaseUrl();
  const response = await fetch(`${base}/api/v1/days-of-use`, { credentials: 'include' });
  if (!response.ok) {
    let message = response.statusText;
    try {
      const body = await response.json();
      message = parseApiErrorBody(body) ?? message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  const raw = await response.json();
  const parsed = daysOfUseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error('Days of use response failed validation.');
  }
  return parsed.data;
}

export async function stampDayOfUse(utcDate?: string): Promise<string> {
  const base = getApiBaseUrl();
  const response = await fetch(`${base}/api/v1/days-of-use`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(utcDate ? { utcDate } : {}),
  });
  if (!response.ok) {
    let message = response.statusText;
    try {
      const body = await response.json();
      message = parseApiErrorBody(body) ?? message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  const raw = (await response.json()) as { utcDate?: string };
  if (typeof raw.utcDate !== 'string') {
    throw new Error('Days of use stamp response failed validation.');
  }
  return raw.utcDate;
}
