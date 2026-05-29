import type { LlmError } from '../types';
import { extractStatusFromMessage, toErrShape } from './_shared';

/**
 * Normalize an Ollama SDK error into LlmError.
 * Ollama runs locally; the dominant failure mode is the server not
 * being reachable (`ECONNREFUSED` / `Failed to fetch`). Model-not-pulled
 * surfaces as HTTP 404 with "model … not found" wording.
 *
 * Source: architecture.md line 559 (Ollama 'connection refused');
 * AR7 (epics line 168).
 */
export function parseOllamaError(raw: unknown): LlmError {
  const e = toErrShape(raw);
  const status = e.status ?? extractStatusFromMessage(e.message);

  if (e.code === 'ECONNREFUSED' || /ECONNREFUSED|connection refused|Failed to fetch|fetch failed/i.test(e.message)) {
    return {
      kind: 'network',
      providerCode: 'ECONNREFUSED',
      message: `${e.message} (is the Ollama server running on localhost?)`,
      retryable: true,
    };
  }
  if (status === 404 || /model.*not found/i.test(e.message)) {
    return { kind: 'unknown', providerCode: 'model_not_found', message: e.message, retryable: false };
  }
  if ((status !== undefined && status >= 500) || /timeout|network/i.test(e.message)) {
    return {
      kind: 'network',
      providerCode: status ? `HTTP ${status}` : 'network',
      message: e.message,
      retryable: true,
    };
  }
  return { kind: 'unknown', providerCode: status ? `HTTP ${status}` : 'unknown', message: e.message, retryable: false };
}
