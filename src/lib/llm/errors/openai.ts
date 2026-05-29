import type { LlmError } from '../types';
import { extractStatusFromMessage, toErrShape } from './_shared';

/**
 * Normalize an OpenAI SDK error into LlmError.
 * OpenAI vocabulary: 429 `rate_limit_exceeded` (rate limit),
 * 429 `insufficient_quota` (quota_exceeded — non-retryable!),
 * 401 (auth), 5xx / network (network).
 *
 * Source: architecture.md line 559 (OpenAI '429'/'401'/'quota_exceeded');
 * AR7 (epics line 168).
 */
export function parseOpenAiError(raw: unknown): LlmError {
  const e = toErrShape(raw);
  const status = e.status ?? extractStatusFromMessage(e.message);
  const code = e.code ?? extractOpenAiCode(e.message);

  if (code === 'insufficient_quota') {
    return { kind: 'quota_exceeded', providerCode: 'insufficient_quota', message: e.message, retryable: false };
  }
  if (status === 429 || code === 'rate_limit_exceeded') {
    return { kind: 'rate_limit', providerCode: code ?? 'rate_limit_exceeded', message: e.message, retryable: true };
  }
  if (status === 401 || code === 'invalid_api_key' || /api\s*key/i.test(e.message)) {
    return { kind: 'auth', providerCode: code ?? 'invalid_api_key', message: e.message, retryable: false };
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

function extractOpenAiCode(msg: string): string | undefined {
  const m = msg.match(/\b(insufficient_quota|rate_limit_exceeded|invalid_api_key|model_not_found)\b/);
  return m?.[1];
}
