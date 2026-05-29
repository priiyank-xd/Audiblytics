/**
 * Discriminated-union error shape for every LLM-layer failure mode.
 * All 5 per-provider error parsers (`lib/llm/errors/<provider>.ts`)
 * normalize native errors into one of these variants. The `retryable`
 * field is a literal type (`true`/`false`) — `withRetry` uses it as a
 * type-system signal to gate retry attempts (see `with-retry.ts`).
 *
 * Sources: architecture.md lines 397–409; AR7 (epics line 168);
 * FR11 (prd line 725).
 */
export type LlmError =
  | { kind: 'rate_limit'; providerCode: string; message: string; retryable: true; retryAfterMs?: number }
  | { kind: 'quota_exceeded'; providerCode: string; message: string; retryable: false }
  | { kind: 'auth'; providerCode: string; message: string; retryable: false }
  | { kind: 'network'; providerCode: string; message: string; retryable: true }
  | { kind: 'malformed_response'; providerCode: string; message: string; retryable: true }
  | { kind: 'unknown'; providerCode: string; message: string; retryable: false };

/** Parameters supplied by callers (paragraph feature, offline-pack script). */
export type GenerateParagraphOpts = {
  provider: import('@/lib/schemas/provider-keys.schema').ActiveProvider;
  model: import('ai').LanguageModel;
  theme: string;
  persona: string;
  length: number;
  recycleWords: string[];
};

/** Successful return shape — Zod-derived from `paragraphSchema`. */
export type ParagraphResult = import('./schemas/paragraph.schema').ParagraphResult;
