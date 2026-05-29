import { type Result, isErr } from '@/lib/result';
import type { LlmError } from './types';

/**
 * Retry-wrapper for LLM calls. Re-invokes `fn` after a backoff delay
 * when the previous attempt returned `Result.err` with `retryable: true`.
 * Non-retryable errors short-circuit immediately (no backoff applied).
 *
 * Default policy: 3 total attempts (initial + 2 retries) with
 * inter-attempt sleeps `[1000ms, 3000ms]` — matches architecture
 * line 411 + FR12 (prd line 726) + AR8 (epics line 169).
 *
 * The final attempt's error surfaces unchanged on exhaustion — no
 * synthesized "max retries exceeded" wrapper.
 *
 * `LlmError.retryAfterMs` is reserved for UI or future policy tweaks;
 * this helper always uses the deterministic `backoffMs` schedule (architecture line 411).
 */
export async function withRetry<T, E extends LlmError>(
  fn: () => Promise<Result<T, E>>,
  opts: { maxAttempts?: number; backoffMs?: readonly number[] } = {},
): Promise<Result<T, E>> {
  const backoffMs = opts.backoffMs ?? [1000, 3000];
  const maxAttempts = opts.maxAttempts ?? backoffMs.length + 1;

  let lastResult: Result<T, E> | undefined;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    lastResult = await fn();

    if (!isErr(lastResult)) return lastResult;
    if (!lastResult.error.retryable) return lastResult;
    if (attempt === maxAttempts - 1) return lastResult;

    const delay = backoffMs[attempt] ?? backoffMs[backoffMs.length - 1] ?? 0;
    await sleep(delay);
  }

  return lastResult as Result<T, E>;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
