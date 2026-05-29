import type { LlmError } from '../types';
import { extractStatusFromMessage, toErrShape } from './_shared';

/**
 * Normalize an Anthropic SDK error into LlmError.
 * Anthropic vocabulary: `overloaded_error` (server overload, retryable),
 * `rate_limit_error` (rate limit, retryable),
 * `authentication_error` (auth), 5xx (network).
 *
 * Source: architecture.md line 559 (Anthropic 'overloaded_error'/'rate_limit_error');
 * AR7 (epics line 168).
 */
export function parseAnthropicError(raw: unknown): LlmError {
  const e = toErrShape(raw);
  const status = e.status ?? extractStatusFromMessage(e.message);
  const code = e.code ?? extractAnthropicCode(e.message);

  if (code === 'overloaded_error' || code === 'rate_limit_error' || status === 429) {
    return { kind: 'rate_limit', providerCode: code ?? 'rate_limit_error', message: e.message, retryable: true };
  }
  if (code === 'authentication_error' || status === 401) {
    return { kind: 'auth', providerCode: 'authentication_error', message: e.message, retryable: false };
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

function extractAnthropicCode(msg: string): string | undefined {
  const m = msg.match(/\b(overloaded_error|rate_limit_error|authentication_error|invalid_request_error|not_found_error)\b/);
  return m?.[1];
}
