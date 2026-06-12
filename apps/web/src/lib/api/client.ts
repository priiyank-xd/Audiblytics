export type ApiErrorBody = {
  error: {
    kind: string;
    message: string;
  };
};

export function getApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL;
  if (configured !== undefined && configured.length > 0) {
    return configured.replace(/\/$/, '');
  }
  return '';
}

const API_UNREACHABLE_MESSAGE =
  'API is not running. From repo root run ./dev (API mode) or start manually: docker compose up -d postgres && cd apps/api && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000';

function isNetworkFetchError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  const nested =
    error.cause instanceof Error
      ? error.cause.message
      : typeof error.cause === 'string'
        ? error.cause
        : '';
  const combined = `${error.message} ${nested}`.toLowerCase();
  return /fetch failed|failed to fetch|econnrefused|connection refused/.test(combined);
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const base = getApiBaseUrl();
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    });
  } catch (error) {
    if (isNetworkFetchError(error)) {
      throw new Error(API_UNREACHABLE_MESSAGE);
    }
    throw error;
  }

  if (!response.ok) {
    let message = response.statusText;
    try {
      const body = (await response.json()) as ApiErrorBody;
      if (body.error?.message) message = body.error.message;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
