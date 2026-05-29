import type { LlmError } from '../types';
import { messageFromUnknown, statusFromUnknown } from './_shared';
import { parseOpenAiError } from './openai';

/**
 * Normalize an OpenRouter SDK error into LlmError.
 * OpenRouter exposes an OpenAI-compatible error surface for most failures,
 * plus an OpenRouter-specific HTTP 402 (out of credits / quota_exceeded).
 *
 * Source: architecture.md line 559 (OpenRouter mapped via OpenAI-compatible parser);
 * AR7 (epics line 168).
 */
export function parseOpenRouterError(raw: unknown): LlmError {
  const status = statusFromUnknown(raw);

  if (status === 402) {
    return { kind: 'quota_exceeded', providerCode: 'HTTP 402', message: messageFromUnknown(raw), retryable: false };
  }

  return parseOpenAiError(raw);
}
