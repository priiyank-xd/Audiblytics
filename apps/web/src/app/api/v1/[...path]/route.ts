import { type NextRequest, NextResponse } from 'next/server';

const API_ORIGIN = (process.env.API_URL ?? 'http://127.0.0.1:8000').replace(/\/$/, '');

function apiUnreachableMessage(origin: string): string {
  return `API is not running at ${origin}. From repo root: docker compose up -d postgres && cd apps/api && source .venv/bin/activate && uvicorn app.main:app --reload --host 127.0.0.1 --port 8000 — or run ./ax start (ports in .env; starts API when NEXT_PUBLIC_STORAGE_BACKEND=api).`;
}

function networkErrorMessage(cause: unknown): string {
  if (!(cause instanceof Error)) {
    return 'Could not reach the API.';
  }
  const nested =
    cause.cause instanceof Error
      ? cause.cause.message
      : typeof cause.cause === 'string'
        ? cause.cause
        : '';
  const combined = `${cause.message} ${nested}`.toLowerCase();
  if (/fetch failed|failed to fetch|econnrefused|connection refused/.test(combined)) {
    return apiUnreachableMessage(API_ORIGIN);
  }
  return cause.message;
}

/**
 * Proxies /api/v1/* to FastAPI so session cookies are forwarded on every request.
 * (next.config rewrites alone do not reliably pass Set-Cookie / Cookie in dev.)
 */
async function proxyToApi(request: NextRequest, pathSegments: string[]): Promise<NextResponse> {
  const path = pathSegments.join('/');
  const target = `${API_ORIGIN}/api/v1/${path}${request.nextUrl.search}`;

  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('connection');

  const init: RequestInit & { duplex?: 'half' } = {
    method: request.method,
    headers,
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const body = await request.arrayBuffer();
    if (body.byteLength > 0) {
      init.body = body;
      init.duplex = 'half';
    }
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, init);
  } catch (cause) {
    const message = networkErrorMessage(cause);
    return NextResponse.json(
      { error: { kind: 'network', message } },
      { status: 503 },
    );
  }
  const outHeaders = new Headers();

  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === 'transfer-encoding') return;
    if (lower === 'set-cookie') {
      outHeaders.append('set-cookie', value);
      return;
    }
    outHeaders.set(key, value);
  });

  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: outHeaders,
  });
}

type RouteContext = { params: Promise<{ path: string[] }> };

async function handle(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { path } = await context.params;
  return proxyToApi(request, path);
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
export const DELETE = handle;
