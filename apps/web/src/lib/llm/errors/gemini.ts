import type { LlmError } from '../types';
import { extractStatusFromMessage, toErrShape } from './_shared';

/**
 * Normalize a Gemini SDK error into LlmError.
 * Gemini error vocabulary: HTTP 429 + `RESOURCE_EXHAUSTED` (rate limit),
 * HTTP 403 + `PERMISSION_DENIED` (auth), HTTP 403 + quota wording
 * (quota_exceeded), 5xx / fetch failure (network).
 *
 * Source: architecture.md line 559 (Gemini 'RESOURCE_EXHAUSTED'/'403');
 * AR7 (epics line 168).
 */
export function parseGeminiError(raw: unknown): LlmError {
  const e = toErrShape(raw);
  const status = e.status ?? extractStatusFromMessage(e.message);
  const code = e.code ?? extractGeminiCode(e.message);

  if (status === 429 || code === 'RESOURCE_EXHAUSTED') {
    return { kind: 'rate_limit', providerCode: 'RESOURCE_EXHAUSTED', message: e.message, retryable: true };
  }
  if (status === 403 && /quota/i.test(e.message)) {
    return { kind: 'quota_exceeded', providerCode: 'QUOTA_EXCEEDED', message: e.message, retryable: false };
  }
  if (status === 403 || code === 'PERMISSION_DENIED' || /api\s*key/i.test(e.message)) {
    return { kind: 'auth', providerCode: 'PERMISSION_DENIED', message: e.message, retryable: false };
  }
  if ((status !== undefined && status >= 500) || /fetch|network|timeout/i.test(e.message)) {
    return {
      kind: 'network',
      providerCode: status ? `HTTP ${status}` : 'network',
      message: e.message,
      retryable: true,
    };
  }
  return {
    kind: 'unknown',
    providerCode: code ?? (status ? `HTTP ${status}` : 'unknown'),
    message: e.message,
    retryable: false,
  };
}

function extractGeminiCode(msg: string): string | undefined {
  const m = msg.match(/\b(RESOURCE_EXHAUSTED|PERMISSION_DENIED|UNAUTHENTICATED|QUOTA_EXCEEDED)\b/);
  return m?.[1];
}
