/** Narrow error fields used by per-provider parsers. */
export type ErrShape = { status?: number; code?: string; message: string };

const KEY_PATTERNS = [
  /\bsk-[A-Za-z0-9]{20,}\b/g,
  /\bAIza[A-Za-z0-9_-]{20,}\b/g,
  /\bsk-ant-[A-Za-z0-9-]{20,}\b/g,
];

/**
 * Replace API-key-shaped substrings so `LlmError.message` never leaks secrets.
 */
export function redactApiKeys(message: string): string {
  let out = message;
  for (const re of KEY_PATTERNS) {
    out = out.replace(re, '[redacted]');
  }
  return out;
}

export function toErrShape(raw: unknown): ErrShape {
  if (raw instanceof Error) {
    const err = raw as Error & { status?: number; code?: string };
    return {
      message: redactApiKeys(err.message),
      status: typeof err.status === 'number' ? err.status : undefined,
      code: typeof err.code === 'string' ? err.code : undefined,
    };
  }
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    const msg =
      typeof o.message === 'string'
        ? o.message
        : typeof o.error === 'object' && o.error !== null && 'message' in o.error && typeof (o.error as { message?: unknown }).message === 'string'
          ? (o.error as { message: string }).message
          : JSON.stringify(o);
    return {
      message: redactApiKeys(msg),
      status: typeof o.status === 'number' ? o.status : undefined,
      code: typeof o.code === 'string' ? o.code : undefined,
    };
  }
  return { message: redactApiKeys(String(raw)) };
}

export function extractStatusFromMessage(msg: string): number | undefined {
  const m = msg.match(/\b(\d{3})\b/);
  return m ? Number(m[1]) : undefined;
}

export function statusFromUnknown(raw: unknown): number | undefined {
  if (raw instanceof Error) {
    const status = (raw as unknown as Record<string, unknown>).status;
    if (typeof status === 'number') return status;
  }
  if (raw && typeof raw === 'object' && 'status' in raw) {
    const status = (raw as Record<string, unknown>).status;
    if (typeof status === 'number') return status;
  }
  return undefined;
}

export function messageFromUnknown(raw: unknown): string {
  return redactApiKeys(toErrShape(raw).message);
}
