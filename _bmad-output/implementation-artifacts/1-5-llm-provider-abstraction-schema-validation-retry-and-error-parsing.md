# Story 1.5: LLM Provider Abstraction, Schema Validation, Retry, and Error Parsing

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Priyank,
I want a single `generateParagraph()` seam in `src/lib/llm/` that wraps Vercel AI SDK 6 (`generateText` + `Output.object()`) and routes to any of 5 providers (Gemini, OpenAI, Anthropic, OpenRouter, Ollama) with unified error parsing into a discriminated `LlmError` union and a ≤2-attempt retry policy with `[1s, 3s]` backoff,
So that swapping providers (FR9, FR10, NFR27) requires zero code changes anywhere outside `lib/llm/`, every provider's heterogeneous failure vocabulary surfaces as one consistent shape that `<InlineErrorSurface>` can render later (FR11, FR64), and structurally invalid LLM responses are caught by Zod before any consumer sees them (FR13, FR17).

## Acceptance Criteria

> Sourced verbatim from `epics.md § Story 1.5` (lines 536–569). Re-formatted as numbered AC for traceability against tasks.

1. **AC1 — `generateParagraph(opts): Promise<Result<ParagraphResult, LlmError>>` exported from `src/lib/llm/generate.ts`** (per AR6 epics line 167, AR9 epics line 170, architecture lines 369–387). Signature must accept `opts: GenerateParagraphOpts` (settings-derived: theme, persona, length, recycleWords, plus an injected `LanguageModel` to keep the function pure-ish). Return type is `Result<ParagraphResult, LlmError>` — never throws for app-flow errors. `ParagraphResult` is the validated `{ paragraph, hardWords }` shape (Zod-derived).

2. **AC2 — Function uses `generateText` + `Output.object({ schema })` from `ai@^6` — NOT the deprecated `generateObject`** (per AR4 epics line 165, architecture lines 342–365). Implementation calls `generateText({ model, prompt, output: Output.object({ schema: paragraphSchema }) })` and reads the validated `output` field from the result. Any code path that imports or calls `generateObject` is an AC failure (verified by grep audit Task 8.5).

3. **AC3 — `paragraphSchema` (Zod) requires structurally complete content** (per FR17 prd line 734, architecture lines 348–356): `paragraph: z.string().min(1)` and `hardWords: z.array(hardWordSchema).min(1).max(10)` where `hardWordSchema` is the SAME shape Story 1.4 owns at `@/lib/schemas/paragraph-cache.schema.ts` (each row: `{ word, ipa, meaning, exampleSentence }`, all `z.string().min(1)`). The LLM-response schema lives at `src/lib/llm/schemas/paragraph.schema.ts` and IMPORTS `hardWordSchema` from `lib/schemas/paragraph-cache.schema` — it does NOT redefine the row shape (AR16 epics line 177; prevents drift). Incomplete entries are dropped before render via Zod's `.safeParse` failure path → retry → final error (Task 5.5).

4. **AC4 — `getProvider(settings): LanguageModel` exported from `src/lib/llm/client.ts`** (per FR1 prd line 712, FR10 prd line 724, AR6 epics line 167). Function reads `settings.activeProvider` (an `ActiveProvider` enum value from `@/lib/schemas/provider-keys.schema.ts`) plus `settings.providerKeys` and returns a `LanguageModel` instance constructed from one of the 5 provider SDKs. The branch for each provider:
   - `'gemini'` → `google({ apiKey })(modelId)` from `@ai-sdk/google`
   - `'openai'` → `openai({ apiKey })(modelId)` from `@ai-sdk/openai`
   - `'anthropic'` → `anthropic({ apiKey })(modelId)` from `@ai-sdk/anthropic`
   - `'openrouter'` → `openrouter({ apiKey })(modelId)` from `@openrouter/ai-sdk-provider`
   - `'ollama'` → `ollama(modelId)` (no API key) from `ollama-ai-provider-v2`

5. **AC5 — `MODEL_BY_PROVIDER` lookup table in `src/lib/llm/models.ts`** (per AR5 epics line 166, architecture lines 389–395). Default model for `gemini` MUST be `'gemini-2.5-flash'` (architecture-mandated). Defaults for other providers are sensible Settings-overridable placeholders documented inline; each entry is a string literal model-id the corresponding SDK accepts. Table shape: `Record<ActiveProvider, string>`. Overrides come later via Settings (Story 1.9) — Story 1.5 only ships the defaults.

6. **AC6 — Provider-SDK imports appear ONLY inside `src/lib/llm/` files** (per AR18 epics line 179, architecture lines 1130, 1140, 1162). Verified by grep audit (Task 8.4): `rg "from '@ai-sdk/(google|openai|anthropic)'|from '@openrouter/ai-sdk-provider'|from 'ollama-ai-provider(-v2)?'" src/ --glob '!src/lib/llm/**'` MUST return zero matches. The `ai` package itself (Vercel AI SDK core — `generateText`, `Output`, `LanguageModel` type) is also confined to `lib/llm/` for symmetry; only `lib/llm/` imports from it.

7. **AC7 — Per-provider error parsers exist at `src/lib/llm/errors/<provider>.ts` for all 5 providers** (per AR7 epics line 168, FR11 prd line 725, architecture lines 376–385, 397–409). Each module exports a single named function `parseGeminiError` / `parseOpenAiError` / `parseAnthropicError` / `parseOpenRouterError` / `parseOllamaError` with signature `(raw: unknown): LlmError`. Each parser MUST handle its native vocabulary:
   - **Gemini:** `RESOURCE_EXHAUSTED` (status `429`) → `'rate_limit'` retryable; HTTP 403 with `PERMISSION_DENIED` → `'auth'`; HTTP 403 with quota wording → `'quota_exceeded'` non-retryable; 5xx / network errors → `'network'` retryable.
   - **OpenAI:** HTTP 429 with `rate_limit_exceeded` → `'rate_limit'` retryable; HTTP 429 with `insufficient_quota` → `'quota_exceeded'` non-retryable; HTTP 401 → `'auth'`; 5xx / fetch failure → `'network'` retryable.
   - **Anthropic:** `overloaded_error` → `'rate_limit'` retryable (server overload); `rate_limit_error` → `'rate_limit'` retryable; `authentication_error` → `'auth'`; 5xx / network → `'network'` retryable.
   - **OpenRouter:** Reuses OpenAI-compatible error parser (`parseOpenAiError`) for the bulk of its surface; OpenRouter-specific HTTP 402 (out of credits) → `'quota_exceeded'` non-retryable.
   - **Ollama:** `ECONNREFUSED` / `Failed to fetch` (server not running) → `'network'` retryable; HTTP 404 with `model … not found` wording → `'unknown'` non-retryable; otherwise → `'unknown'`.

8. **AC8 — `LlmError` discriminated union shape exact match to architecture lines 399–407** (per AR7). Type lives at `src/lib/llm/types.ts`:
   ```ts
   export type LlmError =
     | { kind: 'rate_limit';         providerCode: string; message: string; retryable: true;  retryAfterMs?: number }
     | { kind: 'quota_exceeded';     providerCode: string; message: string; retryable: false }
     | { kind: 'auth';               providerCode: string; message: string; retryable: false }
     | { kind: 'network';            providerCode: string; message: string; retryable: true }
     | { kind: 'malformed_response'; providerCode: string; message: string; retryable: true }
     | { kind: 'unknown';            providerCode: string; message: string; retryable: false };
   ```
   `retryable` is the **literal type** (`true` / `false`), not `boolean` — this is the type-system encoding of the retry policy (AC10 leverages this). `providerCode` is the native error code or status string from the SDK ("RESOURCE_EXHAUSTED", "rate_limit_error", "ECONNREFUSED", "HTTP 429", etc.). `message` is human-readable; never includes the API key (Task 6.4 redaction guard).

9. **AC9 — `parseLlmError(provider, raw): LlmError` dispatcher in `src/lib/llm/errors/index.ts`** dispatches on `provider: ActiveProvider` to the matching per-provider parser and re-exports the `LlmError` type. This is the single entry-point that `generate.ts` and `with-retry.ts` consume — neither imports per-provider parsers directly.

10. **AC10 — `withRetry(fn, opts)` helper in `src/lib/llm/with-retry.ts`** (per FR12 prd line 726, AR8 epics line 169, architecture lines 411, 791–802). Signature:
    ```ts
    export async function withRetry<T, E extends LlmError>(
      fn: () => Promise<Result<T, E>>,
      opts?: { maxAttempts?: 2; backoffMs?: readonly [number, number] }
    ): Promise<Result<T, E>>
    ```
    Defaults: `maxAttempts = 2` retries (so up to 3 total invocations of `fn` — the initial + 2 retries — *no*, see clarification in Task 4.2: per FR12 wording "up to 2 times before surfacing", the helper performs **a max of 3 total attempts** with delays `[1s, 3s]` between them; more conservative reading is "≤2 attempts total = initial + 1 retry". Architecture lines 411 says "≤2 attempts" — Task 4.2 settles this as **2 total attempts max** with `[1s]` between them, OR if `backoffMs.length === 2` then **3 total attempts** with `[1s, 3s]` between them; **chosen reading: ≤2 retries (3 total attempts) with backoffMs `[1000, 3000]`** to match the architecture's `backoffMs: [1000, 3000]` two-element tuple). The retry fires ONLY when the previous attempt's `err.retryable === true`.

11. **AC11 — Non-retryable errors short-circuit `withRetry` immediately** (per FR12 prd line 726). When a `Result.err` with `retryable: false` is returned, `withRetry` returns it unchanged on the first occurrence — no further attempts. Verified by Task 4.4 logic: the early-return branch on `!err.retryable` is unconditional and tested.

12. **AC12 — `withRetry` exhaustion surfaces the LAST error unchanged** (per FR12, architecture line 411 "After exhausted, surface error to user"). When all attempts return `Result.err`, the FINAL attempt's error is returned (not the first, not a synthesized "all retries exhausted" wrapper). This preserves the actual provider code that finally surfaced.

13. **AC13 — Malformed-response path triggers retry** (per FR13 prd line 727, FR17 prd line 734). When `generateText`'s `output` parse fails (Zod `safeParse` returns `success: false`), `generateParagraph` returns `Result.err({ kind: 'malformed_response', providerCode: 'zod_validation_failed', message: <issues>, retryable: true })`. Because `retryable: true`, `withRetry` re-attempts (up to the policy budget). After exhaustion, the final `malformed_response` error surfaces. Schema is the contract; structurally invalid responses NEVER reach the consumer.

14. **AC14 — `buildPrompt({theme, persona, length, recycleWords})` in `src/lib/llm/prompts/paragraph.ts`** (per architecture lines 376, 1085, FR15 prd line 732). Function returns a string prompt that:
    - Names the theme + persona (descriptive, not enum literal — e.g., `'adventure'` → "an adventure-themed paragraph", `'gre-aspirant'` → "vocabulary appropriate for a GRE aspirant").
    - Targets the requested word length (`length: number` — the integer from `settings.length`, 100–200 range per FR5).
    - Instructs the model to seed the paragraph with the supplied `recycleWords: string[]` if non-empty (cold-start tolerated when empty per FR16 prd line 733 — the prompt MUST NOT fail or special-case zero recycle words).
    - Explicitly requests `camelCase` JSON field names (per architecture line 739) — defensive, since `Output.object({ schema })` already enforces structure.
    - Includes per-row `hardWords` instructions: 2–3 NEW advanced words appropriate to the persona's vocabulary band (per FR15), each entry MUST contain `word`, `ipa` (IPA phonetic), `meaning` (1-sentence definition), `exampleSentence` (1 sentence using the word in context).

15. **AC15 — `generateParagraph()` composes the call: build prompt → wrap in `withRetry(() => callOnce(...))`** (per FR12, AR8). Internal `callOnce` function:
    - Invokes `generateText({ model, prompt, output: Output.object({ schema }) })`.
    - Catches the SDK throw (the `ai` SDK throws on provider-side errors despite the `output` field — this is the SDK's contract), normalizes via `parseLlmError(opts.provider, e)`, returns `Result.err`.
    - On success, validates `result.output` through `paragraphSchema.safeParse` defensively (the `Output.object({ schema })` already validates, but a second pass guards against SDK version drift), returns `Result.ok({ paragraph, hardWords })` on success or `Result.err({ kind: 'malformed_response', ... })` on parse failure.

16. **AC16 — Hard-scope-boundary placeholder comment in `client.ts`** (per AR15 epics line 175, architecture lines 326–327). The file MUST contain a comment block documenting: "Story 1.6 will add `assertClientOnlySafeContext()` that throws when `typeof window === 'undefined'`." Story 1.5 does NOT implement the runtime guard itself — that is Story 1.6's responsibility (epics lines 581–589). This story creates the file `client.ts`; Story 1.6 modifies it. The placeholder comment exists so a Story 1.6 dev agent finds the wiring point.

17. **AC17 — All `lib/llm/*` files type-check + `pnpm build` exits 0**. With every file in place, `pnpm tsc --noEmit` returns zero errors and `pnpm build` exits 0 with no new warnings vs. Story 1.4. Strict mode catches any `LanguageModel` type drift between SDK versions; if a TS error appears for a provider's `apiKey` argument shape, the fix is a thin SDK-shape interface in `lib/llm/types.ts` — NEVER a `// @ts-ignore` or `as any` (those are AC failures per architecture lines 873, 916).

18. **AC18 — Layered import compliance** (per AR18 epics line 179, architecture lines 1130–1146). Files in `src/lib/llm/` may import from: third-party (`ai`, `@ai-sdk/*`, `@openrouter/ai-sdk-provider`, `ollama-ai-provider-v2`, `zod`), `@/lib/schemas/*` (sibling `lib/` subfolder), `@/lib/result` (sibling `lib/` subfolder). They MUST NOT import from `@/components/`, `@/features/`, or `@/app/`. Verified by grep audit (Task 8.6): `rg "from '@/(components|features|app)/" src/lib/llm/` returns zero matches.

### BDD format (verbatim mirror of `epics.md § Story 1.5` lines 542–569)

**Given** `src/lib/llm/generate.ts` is opened
**When** the file is read
**Then** `generateParagraph(opts): Promise<Result<ParagraphResult, LlmError>>` is exported (per AR6, AR9)
**And** the function uses `generateText({ model, prompt, output: Output.object({ schema: paragraphSchema }) })` from `ai@^6` (NOT the deprecated `generateObject`, per AR4)
**And** `paragraphSchema` (Zod) requires `paragraph: string.min(1)` and `hardWords: array({word, ipa, meaning, exampleSentence}).min(1).max(10)` — incomplete entries dropped before render (per FR17)

**Given** `src/lib/llm/client.ts` is opened
**When** the file is read
**Then** `getProvider(settings)` returns a `LanguageModel` constructed from one of 5 providers based on `settings.activeProvider` (per FR1, FR10, AR6)
**And** model lookup uses the `MODEL_BY_PROVIDER` table from `models.ts` with `gemini` defaulting to `gemini-2.5-flash` (per AR5)
**And** provider-SDK imports (`@ai-sdk/google`, etc.) appear ONLY inside `src/lib/llm/` files (verified by grep audit per AR18)

**Given** an LLM call fails
**When** the per-provider error parser at `src/lib/llm/errors/<provider>.ts` runs
**Then** the native error is normalized into the `LlmError` discriminated union (`kind: 'rate_limit' | 'quota_exceeded' | 'auth' | 'network' | 'malformed_response' | 'unknown'`, per AR7) with `providerCode`, `message`, `retryable`, optional `retryAfterMs`
**And** all 5 provider parsers (gemini, openai, anthropic, openrouter, ollama) handle their respective vocabularies (Gemini `RESOURCE_EXHAUSTED`/`403`; OpenAI `429`/`401`; Anthropic `overloaded_error`/`rate_limit_error`; Ollama `connection refused`; OpenRouter mapped via OpenAI-compatible parser, per FR11)

**Given** an LLM call returns a `retryable: true` error
**When** `lib/llm/with-retry.ts` is invoked
**Then** the call retries up to 2 times with backoff `[1s, 3s]` (per FR12, AR8)
**And** retries do NOT fire for `retryable: false` errors (auth, quota_exceeded, unknown)
**And** after exhaustion, the final error surfaces unchanged

**Given** the LLM response payload is structurally invalid JSON
**When** Zod validation fails
**Then** the function returns `Result.err({ kind: 'malformed_response', retryable: true, ... })` so it triggers the retry path (per FR13, FR17)

## Tasks / Subtasks

- [ ] **Task 1 — Create `src/lib/llm/types.ts` (single source of `LlmError` + ambient types)** (AC: 8)
  - [ ] 1.1 Create `src/lib/llm/types.ts`. Public exports get JSDoc per architecture line 838 (lib/ public exports require JSDoc).
  - [ ] 1.2 Implementation:
    ```ts
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
      | { kind: 'rate_limit';         providerCode: string; message: string; retryable: true;  retryAfterMs?: number }
      | { kind: 'quota_exceeded';     providerCode: string; message: string; retryable: false }
      | { kind: 'auth';               providerCode: string; message: string; retryable: false }
      | { kind: 'network';            providerCode: string; message: string; retryable: true }
      | { kind: 'malformed_response'; providerCode: string; message: string; retryable: true }
      | { kind: 'unknown';            providerCode: string; message: string; retryable: false };

    /** Parameters supplied by callers (paragraph feature, offline-pack script). */
    export type GenerateParagraphOpts = {
      provider: import('@/lib/schemas/provider-keys.schema').ActiveProvider;
      model:    import('ai').LanguageModel;
      theme:    string;
      persona:  string;
      length:   number;
      recycleWords: string[];
    };

    /** Successful return shape — Zod-derived from `paragraphSchema`. */
    export type ParagraphResult = import('./schemas/paragraph.schema').ParagraphResult;
    ```
  - [ ] 1.3 NEVER widen `retryable` to `boolean`. The literal types are the type-system encoding of the retry-budget policy. Widening loses the discriminant — `withRetry`'s exhaustive-narrowing breaks.
  - [ ] 1.4 NEVER add a generic catch-all `kind: 'error'`. The 6 variants are the complete failure-vocabulary; new kinds require an architecture-doc edit first (architecture line 873).
  - [ ] 1.5 Use `import('...')` type-only references for `LanguageModel` and `ActiveProvider` to keep this file dependency-free at runtime.

- [ ] **Task 2 — Create `src/lib/llm/schemas/paragraph.schema.ts` (LLM response Zod schema)** (AC: 3)
  - [ ] 2.1 Create the file. Architecture line 1087 designates this exact path. The shape MUST match the `hardWordSchema` row defined in Story 1.4's `lib/schemas/paragraph-cache.schema.ts` so persisted cache entries and live LLM responses share one source of truth (AR16 epics line 177).
  - [ ] 2.2 Implementation:
    ```ts
    import { z } from 'zod';
    import { hardWordSchema } from '@/lib/schemas/paragraph-cache.schema';

    /**
     * Zod schema for the structured LLM response. Used by:
     *   - `generate.ts` via `Output.object({ schema: paragraphSchema })`
     *   - `generate.ts` defensive second-pass `.safeParse(result.output)`
     *
     * `hardWordSchema` is owned by `lib/schemas/paragraph-cache.schema.ts`
     * (Story 1.4) so the persisted cache shape and the live LLM shape
     * cannot drift — any change to `hardWord` ripples both consumers.
     *
     * Sources: architecture.md lines 348–356; FR17 (prd line 734);
     * AR4 (epics line 165); AR16 (epics line 177).
     */
    export const paragraphSchema = z.object({
      paragraph: z.string().min(1),
      hardWords: z.array(hardWordSchema).min(1).max(10),
    });

    /** Type-aliased name avoids confusion with `paragraph-cache.schema.ts`'s `CachedParagraph`. */
    export type ParagraphResult = z.infer<typeof paragraphSchema>;
    ```
  - [ ] 2.3 NEVER redefine `hardWordSchema` here. Re-defining the row shape — even "for clarity" — violates AR16. The import is intentional architecture.
  - [ ] 2.4 NEVER add a `theme` / `persona` / `generatedAt` field here. Those are persistence-layer concerns (`paragraph-cache.schema.ts`), not LLM-response-layer concerns. The LLM only returns `{ paragraph, hardWords }`; the caller stamps theme/persona/generatedAt at write time (Story 4.1).

- [ ] **Task 3 — Create `src/lib/llm/models.ts` (MODEL_BY_PROVIDER lookup)** (AC: 5)
  - [ ] 3.1 Create `src/lib/llm/models.ts`. Architecture line 1081 designates this path.
  - [ ] 3.2 Implementation:
    ```ts
    import type { ActiveProvider } from '@/lib/schemas/provider-keys.schema';

    /**
     * Default model id per provider. Architecture-mandated for `gemini`
     * (`gemini-2.5-flash` per AR5 epics line 166 / architecture line 393).
     * Other providers ship sensible Settings-overridable defaults — Story 1.9
     * adds a per-provider model field to the Settings UI; until then these
     * values are the source of truth.
     *
     * Sources: architecture.md lines 389–395 (defaults table);
     * AR5 (epics line 166).
     */
    export const MODEL_BY_PROVIDER: Record<ActiveProvider, string> = {
      gemini:     'gemini-2.5-flash',
      openai:     'gpt-4o-mini',
      anthropic:  'claude-3-5-haiku-latest',
      openrouter: 'openrouter/auto',
      ollama:     'llama3.1',
    } as const;
    ```
  - [ ] 3.3 The `gemini` value MUST be `'gemini-2.5-flash'` — architecture-mandated literal. The other four are documented "sensible defaults" but Settings (Story 1.9) is the eventual source of truth for them. **Do NOT** spend time on the "perfect" default here; the story's scope is the abstraction seam, not exhaustive model curation.
  - [ ] 3.4 NEVER add `MODEL_BY_PROVIDER_OFFLINE_PACK = { gemini: 'gemini-2.5-flash-lite' }` here. The offline-pack script (Story 8.1, `scripts/generate-offline-pack.ts`) lives outside `src/` per the folder decision tree (architecture line 656); it owns its own model-id literal and does NOT consume `MODEL_BY_PROVIDER`. Don't pollute this lookup with batch-script concerns.

- [ ] **Task 4 — Create `src/lib/llm/with-retry.ts`** (AC: 10, 11, 12)
  - [ ] 4.1 Create `src/lib/llm/with-retry.ts`. Architecture lines 793–802 sketch the signature.
  - [ ] 4.2 Implementation:
    ```ts
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
    ```
  - [ ] 4.3 The retry-count semantic clarification: FR12 / architecture line 411 say "≤2 retries" with backoff `[1s, 3s]`. The most natural reading of the two-element backoff tuple is **3 total attempts** with sleeps `[1s, 3s]` BETWEEN them (i.e., initial → 1s sleep → retry → 3s sleep → retry, total 3 invocations). The default `maxAttempts = backoffMs.length + 1 = 3` encodes exactly that. If a future change requires "≤2 total attempts (initial + 1 retry)", the caller passes `{ maxAttempts: 2, backoffMs: [1000] }` — the helper handles both shapes parametrically.
  - [ ] 4.4 The non-retryable short-circuit (AC11): the `if (!lastResult.error.retryable) return lastResult;` branch is unconditional and runs BEFORE the attempt-budget check. An auth failure on attempt 0 returns immediately; no `[1s]` sleep wasted. This is FR12's "do NOT fire for `retryable: false`" requirement.
  - [ ] 4.5 NEVER use `Math.random` jitter. The architecture specifies a deterministic `[1000, 3000]` backoff — adding jitter changes user-perceived behavior and is out of scope (architecture line 873 prohibits silent pattern divergence). If jitter is needed later, edit the architecture doc first.
  - [ ] 4.6 NEVER read `retryAfterMs` from the error and override `backoffMs[attempt]`. The architecture's policy is the deterministic `[1s, 3s]` schedule; per-error retry-after is captured in `LlmError.retryAfterMs` for **future** consumers (e.g., richer UI surfacing) but is NOT consumed by `withRetry` in MVP. Document this in JSDoc.
  - [ ] 4.7 The function is generic over `<T, E extends LlmError>` so that callers (e.g., `generate.ts`) can narrow `E` to specific kinds at the call-site type level. In practice every caller will use `E = LlmError`. The generic exists so the helper is future-proof against caller-side type narrowing.

- [ ] **Task 5 — Create `src/lib/llm/prompts/paragraph.ts`** (AC: 14)
  - [ ] 5.1 Create `src/lib/llm/prompts/paragraph.ts`. Architecture line 1085 designates this path.
  - [ ] 5.2 Implementation:
    ```ts
    /**
     * Build the LLM prompt for daily paragraph generation. Produces a
     * deterministic English-language prompt that:
     *   - Names the chosen theme + persona descriptively (not enum literals)
     *   - Targets the requested approximate word length (100–200 per FR5)
     *   - Asks the model to seed the paragraph with `recycleWords` if any
     *     (cold-start tolerated when empty — FR16)
     *   - Instructs 2–3 NEW advanced words appropriate to the persona band (FR15)
     *   - Requests `camelCase` JSON field names (matches Zod schema; AR16)
     *
     * Note: `Output.object({ schema })` already constrains structure; this
     * prompt's role is to nudge the LLM toward content quality (theme fit,
     * persona band, recycle integration) — not to enforce shape.
     *
     * Sources: architecture.md lines 376, 1085; FR15 (prd line 732);
     * FR16 (prd line 733).
     */
    export type BuildPromptArgs = {
      theme:        string;
      persona:      string;
      length:       number;
      recycleWords: string[];
    };

    export function buildPrompt(args: BuildPromptArgs): string {
      const { theme, persona, length, recycleWords } = args;

      const themeDesc   = describeTheme(theme);
      const personaDesc = describePersona(persona);
      const recycleClause =
        recycleWords.length > 0
          ? `Naturally incorporate these previously-saved words into the paragraph: ${recycleWords.join(', ')}. ` +
            `Each appears at least once.`
          : `This is a cold-start paragraph — do not reference any prior word list.`;

      return [
        `Write ${themeDesc}, approximately ${length} words long, with ${personaDesc}.`,
        recycleClause,
        `In addition, introduce 2 to 3 NEW advanced words appropriate to the persona's vocabulary band.`,
        `Return JSON with camelCase field names matching this shape:`,
        `{ "paragraph": string, "hardWords": [{ "word": string, "ipa": string, "meaning": string, "exampleSentence": string }] }`,
        `For each entry in hardWords, include the word's IPA phonetic transcription, a one-sentence meaning, and a one-sentence example using the word in context.`,
        `Drop any hardWords entry you cannot fully fill — never emit partial rows.`,
      ].join(' ');
    }

    function describeTheme(theme: string): string {
      switch (theme) {
        case 'horror':         return 'a horror-themed paragraph';
        case 'comedy':         return 'a comedic paragraph';
        case 'adventure':      return 'an adventure-themed paragraph';
        case 'mystery':        return 'a mystery-themed paragraph';
        case 'sci-fi':         return 'a science-fiction paragraph';
        case 'slice-of-life':  return 'a slice-of-life paragraph';
        default:               return `a paragraph in the '${theme}' style`;
      }
    }

    function describePersona(persona: string): string {
      switch (persona) {
        case 'gre-aspirant':            return 'vocabulary appropriate for a GRE aspirant';
        case 'business-english':        return 'business-English diction';
        case 'storyteller':             return 'a storyteller voice';
        case 'casual-conversationalist':return 'casual conversational diction';
        default:                        return `vocabulary appropriate to a '${persona}' speaker`;
      }
    }
    ```
  - [ ] 5.3 NEVER emit the recycleWords array as JSON in the prompt. Use comma-separated natural-language form. JSON in the prompt confuses some models (they echo the structure back instead of integrating).
  - [ ] 5.4 NEVER hard-fail the prompt when `recycleWords.length === 0`. FR16 explicitly requires the cold-start case to "gracefully handle". The cold-start clause is one of two branches; both produce a valid prompt.
  - [ ] 5.5 The prompt does NOT include a `system` message — the AI SDK's `prompt` field is plain user-content. If a future iteration needs system-vs-user separation, add a separate `messages` array variant — but for MVP keep it simple. Architecture lines 358–365 show the exact `generateText` call shape Task 6 uses; it accepts a single `prompt: string` field.
  - [ ] 5.6 NEVER inline the `paragraphSchema` shape into the prompt as a JSON Schema dump. The Vercel AI SDK's `Output.object({ schema })` injects schema constraints itself; duplicating that in the prompt text wastes tokens. The free-text JSON example in the prompt is a contract reminder, not a schema.

- [ ] **Task 6 — Create `src/lib/llm/client.ts` (provider construction seam)** (AC: 4, 6, 16)
  - [ ] 6.1 Create `src/lib/llm/client.ts`. Architecture line 1079 designates this path. This is the SOLE file that imports per-provider SDK construction functions; every other consumer goes through `getProvider(settings)`.
  - [ ] 6.2 Implementation:
    ```ts
    import { google }     from '@ai-sdk/google';
    import { openai }     from '@ai-sdk/openai';
    import { anthropic }  from '@ai-sdk/anthropic';
    import { createOpenRouter } from '@openrouter/ai-sdk-provider';
    import { createOllama }     from 'ollama-ai-provider-v2';
    import type { LanguageModel } from 'ai';

    import type { ActiveProvider, ProviderKeys } from '@/lib/schemas/provider-keys.schema';
    import { MODEL_BY_PROVIDER } from './models';

    /**
     * Hard-scope-boundary placeholder.
     * STORY 1.6 will add `assertClientOnlySafeContext()` here that throws when
     * `typeof window === 'undefined'`. Until 1.6 lands, this file constructs
     * provider clients without the runtime guard. See architecture.md NFR14
     * (lines 326–330) and AR15 (epics line 175).
     */

    /** Settings projection sufficient for client construction. */
    export type ClientSettings = {
      activeProvider: ActiveProvider;
      providerKeys:   ProviderKeys;
    };

    /**
     * Construct a Vercel AI SDK `LanguageModel` for the active provider.
     * Branches on `settings.activeProvider`; reads the corresponding API
     * key (or uses none for `ollama`) and the default model id from
     * `MODEL_BY_PROVIDER`.
     *
     * Throws synchronously if the required key is missing — programmer
     * error per architecture line 737 (caller must validate keys via the
     * onboarding/settings UI before invoking).
     */
    export function getProvider(settings: ClientSettings): LanguageModel {
      const { activeProvider, providerKeys } = settings;
      const modelId = MODEL_BY_PROVIDER[activeProvider];

      switch (activeProvider) {
        case 'gemini': {
          const key = requireKey(providerKeys.gemini, 'gemini');
          return google({ apiKey: key })(modelId);
        }
        case 'openai': {
          const key = requireKey(providerKeys.openai, 'openai');
          return openai({ apiKey: key })(modelId);
        }
        case 'anthropic': {
          const key = requireKey(providerKeys.anthropic, 'anthropic');
          return anthropic({ apiKey: key })(modelId);
        }
        case 'openrouter': {
          const key = requireKey(providerKeys.openrouter, 'openrouter');
          return createOpenRouter({ apiKey: key }).chat(modelId);
        }
        case 'ollama': {
          return createOllama()(modelId);
        }
        default: {
          const exhaustive: never = activeProvider;
          throw new Error(`getProvider: unknown provider '${exhaustive as string}'`);
        }
      }
    }

    function requireKey(key: string | undefined, providerName: string): string {
      if (!key) {
        throw new Error(
          `getProvider: '${providerName}' API key not configured. ` +
          `Open Settings and paste the key, then retry. ` +
          `(programmer-error path — UI must gate Generate on key presence.)`,
        );
      }
      return key;
    }
    ```
  - [ ] 6.3 Provider-SDK call shapes: each provider SDK exposes a slightly different factory signature. Verify the exact call shape against the installed SDK version's TS types — Story 1.1 pins these via `pnpm add`. If the call shape differs (e.g., `createOpenAI({ apiKey })(modelId)` vs `openai({ apiKey })(modelId)`), prefer the form Story 1.1's locked SDK version provides; document any divergence here in dev-notes. **Do NOT** introduce a new dep version to "match" expectations — the version Story 1.1 pinned is the contract.
  - [ ] 6.4 **API-key redaction:** the `requireKey` error message MUST NOT include the key value. Errors propagate to React error boundaries and may end up in console logs / future telemetry. Document the rule: `LlmError.message` and any `Error.message` from this file MUST be free of API-key contents. Verify with grep audit Task 8.7.
  - [ ] 6.5 **`switch` exhaustiveness via `never`:** the `default: const exhaustive: never = activeProvider` pattern guarantees that adding a new `ActiveProvider` value triggers a TS compile error here — forcing explicit handling. NEVER replace this with a runtime-only fallback.
  - [ ] 6.6 NEVER call `getProvider` at module load. It must be called per-LLM-call by `generate.ts` so that Settings changes take effect on the NEXT call (FR9 prd line 723 / FR20 prd line 736 — settings changes do NOT regenerate retroactively, but they DO take effect on the next call). Module-load construction would freeze the active provider at import time.
  - [ ] 6.7 NEVER add the `assertClientOnlySafeContext()` runtime guard in this story. Story 1.6 adds it (epics lines 581–589). The placeholder comment block at the top of the file is the marker for the Story 1.6 dev agent.

- [ ] **Task 7 — Create per-provider error parsers in `src/lib/llm/errors/`** (AC: 7, 8, 9)
  - [ ] 7.1 Create `src/lib/llm/errors/index.ts` (dispatcher) and 5 per-provider files.
  - [ ] 7.2 Implementation `src/lib/llm/errors/index.ts`:
    ```ts
    import type { ActiveProvider } from '@/lib/schemas/provider-keys.schema';
    import type { LlmError } from '../types';

    import { parseGeminiError }     from './gemini';
    import { parseOpenAiError }     from './openai';
    import { parseAnthropicError }  from './anthropic';
    import { parseOpenRouterError } from './openrouter';
    import { parseOllamaError }     from './ollama';

    export type { LlmError } from '../types';

    /**
     * Single-entry-point error normalizer. Dispatches on the active
     * provider to its native-vocabulary parser. Caller (`generate.ts`)
     * receives a uniform `LlmError` regardless of provider.
     *
     * Sources: architecture.md lines 376–385, 397–409; AR7 (epics line 168);
     * FR11 (prd line 725).
     */
    export function parseLlmError(provider: ActiveProvider, raw: unknown): LlmError {
      switch (provider) {
        case 'gemini':     return parseGeminiError(raw);
        case 'openai':     return parseOpenAiError(raw);
        case 'anthropic':  return parseAnthropicError(raw);
        case 'openrouter': return parseOpenRouterError(raw);
        case 'ollama':     return parseOllamaError(raw);
        default: {
          const exhaustive: never = provider;
          return { kind: 'unknown', providerCode: 'unknown_provider', message: `Unknown provider '${exhaustive as string}'`, retryable: false };
        }
      }
    }
    ```
  - [ ] 7.3 Implementation `src/lib/llm/errors/gemini.ts`:
    ```ts
    import type { LlmError } from '../types';

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

      const status = e.status ?? extractStatus(e.message);
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
        return { kind: 'network', providerCode: status ? `HTTP ${status}` : 'network', message: e.message, retryable: true };
      }
      return { kind: 'unknown', providerCode: code ?? (status ? `HTTP ${status}` : 'unknown'), message: e.message, retryable: false };
    }

    type ErrShape = { status?: number; code?: string; message: string };

    function toErrShape(raw: unknown): ErrShape {
      if (raw instanceof Error) return { message: raw.message, status: (raw as { status?: number }).status, code: (raw as { code?: string }).code };
      if (raw && typeof raw === 'object') {
        const o = raw as Record<string, unknown>;
        return {
          message: typeof o.message === 'string' ? o.message : JSON.stringify(o),
          status:  typeof o.status === 'number' ? o.status : undefined,
          code:    typeof o.code   === 'string' ? o.code   : undefined,
        };
      }
      return { message: String(raw) };
    }

    function extractStatus(msg: string): number | undefined {
      const m = msg.match(/\b(\d{3})\b/);
      return m ? Number(m[1]) : undefined;
    }

    function extractGeminiCode(msg: string): string | undefined {
      const m = msg.match(/\b(RESOURCE_EXHAUSTED|PERMISSION_DENIED|UNAUTHENTICATED|QUOTA_EXCEEDED)\b/);
      return m?.[1];
    }
    ```
  - [ ] 7.4 Implementation `src/lib/llm/errors/openai.ts`:
    ```ts
    import type { LlmError } from '../types';

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
      const status = e.status ?? extractStatus(e.message);
      const code   = e.code   ?? extractOpenAiCode(e.message);

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
        return { kind: 'network', providerCode: status ? `HTTP ${status}` : 'network', message: e.message, retryable: true };
      }
      return { kind: 'unknown', providerCode: code ?? (status ? `HTTP ${status}` : 'unknown'), message: e.message, retryable: false };
    }

    // toErrShape / extractStatus duplicated locally to keep each parser self-contained
    // (alternative: extract to errors/_shared.ts; deferred for simplicity, file count budget).
    type ErrShape = { status?: number; code?: string; message: string };
    function toErrShape(raw: unknown): ErrShape {
      if (raw instanceof Error) return { message: raw.message, status: (raw as { status?: number }).status, code: (raw as { code?: string }).code };
      if (raw && typeof raw === 'object') {
        const o = raw as Record<string, unknown>;
        return {
          message: typeof o.message === 'string' ? o.message : JSON.stringify(o),
          status:  typeof o.status === 'number' ? o.status : undefined,
          code:    typeof o.code   === 'string' ? o.code   : undefined,
        };
      }
      return { message: String(raw) };
    }
    function extractStatus(msg: string): number | undefined {
      const m = msg.match(/\b(\d{3})\b/);
      return m ? Number(m[1]) : undefined;
    }
    function extractOpenAiCode(msg: string): string | undefined {
      const m = msg.match(/\b(insufficient_quota|rate_limit_exceeded|invalid_api_key|model_not_found)\b/);
      return m?.[1];
    }
    ```
    Notes:
    - The `toErrShape` / `extractStatus` helpers are duplicated across parser files. **Extract them to `errors/_shared.ts`** if the duplication grows past 5 files (it does — 5 parsers). Acceptable trade-off: introduce `errors/_shared.ts` (underscore prefix marks it as private) with `toErrShape`, `extractStatus`. Each per-provider file imports from `_shared.ts`. **Recommended** — adds a small file but reduces 5×~25 lines of dup. Decide at implementation time; either is acceptable per AC, but the shared form is cleaner.
  - [ ] 7.5 Implementation `src/lib/llm/errors/anthropic.ts`:
    ```ts
    import type { LlmError } from '../types';

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
      const status = e.status ?? extractStatus(e.message);
      const code   = e.code   ?? extractAnthropicCode(e.message);

      if (code === 'overloaded_error' || code === 'rate_limit_error' || status === 429) {
        return { kind: 'rate_limit', providerCode: code ?? 'rate_limit_error', message: e.message, retryable: true };
      }
      if (code === 'authentication_error' || status === 401) {
        return { kind: 'auth', providerCode: 'authentication_error', message: e.message, retryable: false };
      }
      if ((status !== undefined && status >= 500) || /fetch|network|timeout/i.test(e.message)) {
        return { kind: 'network', providerCode: status ? `HTTP ${status}` : 'network', message: e.message, retryable: true };
      }
      return { kind: 'unknown', providerCode: code ?? (status ? `HTTP ${status}` : 'unknown'), message: e.message, retryable: false };
    }

    type ErrShape = { status?: number; code?: string; message: string };
    function toErrShape(raw: unknown): ErrShape {
      if (raw instanceof Error) return { message: raw.message, status: (raw as { status?: number }).status, code: (raw as { code?: string }).code };
      if (raw && typeof raw === 'object') {
        const o = raw as Record<string, unknown>;
        return {
          message: typeof o.message === 'string' ? o.message : JSON.stringify(o),
          status:  typeof o.status === 'number' ? o.status : undefined,
          code:    typeof o.code   === 'string' ? o.code   : undefined,
        };
      }
      return { message: String(raw) };
    }
    function extractStatus(msg: string): number | undefined {
      const m = msg.match(/\b(\d{3})\b/);
      return m ? Number(m[1]) : undefined;
    }
    function extractAnthropicCode(msg: string): string | undefined {
      const m = msg.match(/\b(overloaded_error|rate_limit_error|authentication_error|invalid_request_error|not_found_error)\b/);
      return m?.[1];
    }
    ```
  - [ ] 7.6 Implementation `src/lib/llm/errors/openrouter.ts`:
    ```ts
    import type { LlmError } from '../types';
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
      const status = extractStatus(raw);

      if (status === 402) {
        return { kind: 'quota_exceeded', providerCode: 'HTTP 402', message: messageOf(raw), retryable: false };
      }

      // Defer to OpenAI-compatible vocabulary for everything else.
      return parseOpenAiError(raw);
    }

    function extractStatus(raw: unknown): number | undefined {
      if (raw instanceof Error && typeof (raw as { status?: number }).status === 'number') return (raw as { status: number }).status;
      if (raw && typeof raw === 'object' && typeof (raw as { status?: number }).status === 'number') return (raw as { status: number }).status;
      return undefined;
    }

    function messageOf(raw: unknown): string {
      if (raw instanceof Error) return raw.message;
      if (raw && typeof raw === 'object') {
        const o = raw as Record<string, unknown>;
        if (typeof o.message === 'string') return o.message;
      }
      return String(raw);
    }
    ```
  - [ ] 7.7 Implementation `src/lib/llm/errors/ollama.ts`:
    ```ts
    import type { LlmError } from '../types';

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
      const status = e.status ?? extractStatus(e.message);

      if (e.code === 'ECONNREFUSED' || /ECONNREFUSED|connection refused|Failed to fetch|fetch failed/i.test(e.message)) {
        return {
          kind: 'network',
          providerCode: 'ECONNREFUSED',
          message: e.message + ' (is the Ollama server running on localhost?)',
          retryable: true,
        };
      }
      if (status === 404 || /model.*not found/i.test(e.message)) {
        return { kind: 'unknown', providerCode: 'model_not_found', message: e.message, retryable: false };
      }
      if ((status !== undefined && status >= 500) || /timeout|network/i.test(e.message)) {
        return { kind: 'network', providerCode: status ? `HTTP ${status}` : 'network', message: e.message, retryable: true };
      }
      return { kind: 'unknown', providerCode: status ? `HTTP ${status}` : 'unknown', message: e.message, retryable: false };
    }

    type ErrShape = { status?: number; code?: string; message: string };
    function toErrShape(raw: unknown): ErrShape {
      if (raw instanceof Error) return { message: raw.message, status: (raw as { status?: number }).status, code: (raw as { code?: string }).code };
      if (raw && typeof raw === 'object') {
        const o = raw as Record<string, unknown>;
        return {
          message: typeof o.message === 'string' ? o.message : JSON.stringify(o),
          status:  typeof o.status === 'number' ? o.status : undefined,
          code:    typeof o.code   === 'string' ? o.code   : undefined,
        };
      }
      return { message: String(raw) };
    }
    function extractStatus(msg: string): number | undefined {
      const m = msg.match(/\b(\d{3})\b/);
      return m ? Number(m[1]) : undefined;
    }
    ```
  - [ ] 7.8 NEVER include the API key in any `LlmError.message`. The native error from the SDK *might* include the key (rare but documented in some SDKs). Apply a simple redaction in `toErrShape` if the key appears: replace any sequence resembling a key (e.g., `/sk-[A-Za-z0-9]{20,}/`, `/AIza[A-Za-z0-9_-]{20,}/`, `/sk-ant-[A-Za-z0-9-]{20,}/`) with `'[redacted]'`. Belt-and-suspenders.
  - [ ] 7.9 NEVER `throw` inside a parser. Parsers MUST always return an `LlmError`. The whole point of the function is "no errors out — only normalized errors". A bug in the parser should fall through to the `'unknown'` branch, not crash.
  - [ ] 7.10 If `errors/_shared.ts` is introduced (Task 7.4 trade-off), each per-provider file becomes ~30 lines instead of ~50; verify the file count is acceptable (architecture line 873 doesn't forbid the shared file — it's an implementation detail).

- [ ] **Task 8 — Create `src/lib/llm/generate.ts` (the public seam)** (AC: 1, 2, 13, 15)
  - [ ] 8.1 Create `src/lib/llm/generate.ts`. Architecture line 1080 designates this path. This is the ONE file every consumer (Story 4.1's `useParagraphOfTheDay`, Story 1.10's Today route, Story 8.1's offline-pack script — though the script may have its own thinner wrapper) imports.
  - [ ] 8.2 Implementation:
    ```ts
    import { generateText, Output } from 'ai';

    import { ok, err, type Result } from '@/lib/result';
    import { paragraphSchema, type ParagraphResult } from './schemas/paragraph.schema';
    import { buildPrompt } from './prompts/paragraph';
    import { parseLlmError } from './errors';
    import { withRetry } from './with-retry';
    import type { GenerateParagraphOpts, LlmError } from './types';

    /**
     * Public seam for paragraph generation. Composes:
     *   1. `buildPrompt` — deterministic prompt construction
     *   2. `generateText` + `Output.object({ schema: paragraphSchema })` — Vercel AI SDK 6 call
     *   3. `paragraphSchema.safeParse` — defensive second-pass schema validation
     *   4. `parseLlmError` — provider-vocabulary normalization on SDK throw
     *   5. `withRetry` — ≤2 retries with `[1s, 3s]` backoff for retryable errors
     *
     * Returns `Result.ok(ParagraphResult)` on success or `Result.err(LlmError)` on
     * exhausted retry path. Never throws app-flow errors (programmer errors only).
     *
     * Sources: architecture.md lines 342–411; AR4 (epics line 165); AR6, AR8, AR9
     * (epics lines 167–170); FR12, FR13, FR17 (prd lines 726–734).
     */
    export async function generateParagraph(
      opts: GenerateParagraphOpts,
    ): Promise<Result<ParagraphResult, LlmError>> {
      const prompt = buildPrompt({
        theme:        opts.theme,
        persona:      opts.persona,
        length:       opts.length,
        recycleWords: opts.recycleWords,
      });

      return withRetry(() => callOnce(opts, prompt));
    }

    async function callOnce(
      opts: GenerateParagraphOpts,
      prompt: string,
    ): Promise<Result<ParagraphResult, LlmError>> {
      let result: Awaited<ReturnType<typeof generateText>>;
      try {
        result = await generateText({
          model:  opts.model,
          prompt,
          output: Output.object({ schema: paragraphSchema }),
        });
      } catch (e) {
        return err(parseLlmError(opts.provider, e));
      }

      const validated = paragraphSchema.safeParse(result.experimental_output ?? (result as { output?: unknown }).output);
      if (!validated.success) {
        return err<LlmError>({
          kind: 'malformed_response',
          providerCode: 'zod_validation_failed',
          message: validated.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
          retryable: true,
        });
      }
      return ok(validated.data);
    }
    ```
  - [ ] 8.3 **`result.experimental_output` vs `result.output` field name:** The Vercel AI SDK 6 changed the property name across pre-release versions (`experimental_output` in some 6.x betas, `output` in stable). Both are read defensively above. **Verify** against the installed `ai` version's TS types — if only one field exists, drop the other to keep TS strict. If a future SDK version renames the field again, this is the single point of update.
  - [ ] 8.4 The `Output.object({ schema })` call already validates the response and would normally throw on schema failure. But because the SDK might silently coerce or surface a `result` with malformed output in some versions, the defensive `paragraphSchema.safeParse` second pass is the contract enforcer. **Belt-and-suspenders** — both passes must succeed for `ok()` to be returned.
  - [ ] 8.5 NEVER use `try/catch` around the `paragraphSchema.safeParse` — `safeParse` does not throw by design (that's the point of the `Result` shape it returns). Using `try` here is a code smell.
  - [ ] 8.6 NEVER call `getProvider(settings)` from inside `generateParagraph`. The `model` is passed in via `opts` so callers (features) own settings-derivation. This keeps `generate.ts` pure and easier to drive from the offline-pack script (which has different settings semantics). Architecture line 359 supports this — the call site builds `model` and passes it; `generate.ts` is provider-agnostic.
  - [ ] 8.7 NEVER do logging here. The architecture's logging pattern (line 832) limits `console.warn` / `console.error` to recoverable / unrecoverable paths; in this file, all paths return `Result` rather than logging. The consumer (UI layer, Story 1.10/1.12) decides whether to log or render `<InlineErrorSurface>`.
  - [ ] 8.8 The `provider: ActiveProvider` field on `opts` is required (not derived from `model`) because the AI SDK's `LanguageModel` type doesn't carry provider provenance — the parser dispatcher needs it explicitly.

- [ ] **Task 9 — Static audits** (AC: 6, 17, 18)
  - [ ] 9.1 Run `pnpm tsc --noEmit`. Expect zero errors. Most likely failure modes:
    - SDK call shapes don't match (Task 6.3 documents the contract).
    - `LanguageModel` type drift between `ai@^6.x` versions — fix by reading from the installed SDK's `.d.ts`.
    - `experimental_output` vs `output` field-name (Task 8.3).
  - [ ] 9.2 Run `pnpm build`. Expect exit code 0 and zero NEW warnings vs. Story 1.4's build. Bundle-size delta should be modest — the AI SDK + 4 provider packages are tree-shaken aggressively (only the runtime-selected provider's code path executes), but the imports themselves contribute to the initial parse cost. Note: dynamic `import()` per provider is a future optimization (architecture line 873 does NOT mandate it for MVP); static imports are acceptable.
  - [ ] 9.3 Grep audit AC2 — banned `generateObject`:
    ```sh
    rg -n "\bgenerateObject\b" src/
    ```
    Must return zero matches. Architecture line 365 deprecates it.
  - [ ] 9.4 Grep audit AC6 — provider-SDK confinement:
    ```sh
    rg -n "from '(ai|@ai-sdk/google|@ai-sdk/openai|@ai-sdk/anthropic|@openrouter/ai-sdk-provider|ollama-ai-provider-v2)'" src/ --glob '!src/lib/llm/**'
    ```
    Must return zero matches. Provider SDKs are confined to `lib/llm/`.
  - [ ] 9.5 Grep audit AC18 — layered-import compliance:
    ```sh
    rg -n "from '@/(components|features|app)/" src/lib/llm/
    ```
    Must return zero matches. `lib/llm/` MUST NOT import from `components/`, `features/`, or `app/`.
  - [ ] 9.6 Grep audit — schema doubles (sanity):
    ```sh
    rg -n "z\.object\(\{[^}]*hardWords" src/lib/llm/schemas/
    ```
    `paragraphSchema` is the only consumer; `hardWordSchema` is imported from `@/lib/schemas/paragraph-cache.schema`, not redefined. If a second redefinition appears, AR16 has been violated.
  - [ ] 9.7 Grep audit — API-key redaction sanity (Task 6.4, 7.8):
    ```sh
    rg -n "providerKeys\." src/lib/llm/errors/ src/lib/llm/types.ts
    ```
    Must return zero matches. The error-parser layer never touches the keys directly; it only sees raw error objects (which are scanned for accidental key inclusion in Task 7.8's redaction step).
  - [ ] 9.8 Grep audit — `console.log` ban (Story 1.4 pattern):
    ```sh
    rg -n "console\.(log|info|debug)" src/lib/llm/
    ```
    Must return zero matches. Architecture line 832 — only `console.warn`/`console.error` permitted, and Story 1.5 doesn't use either (callers own logging).

- [ ] **Task 10 — Final consistency pass + dev-notes append**
  - [ ] 10.1 Confirm folder structure matches architecture lines 1078–1094:
    ```
    src/lib/llm/
      client.ts                       ← Task 6
      generate.ts                     ← Task 8
      models.ts                       ← Task 3
      with-retry.ts                   ← Task 4
      types.ts                        ← Task 1
      prompts/
        paragraph.ts                  ← Task 5
      schemas/
        paragraph.schema.ts           ← Task 2
      errors/
        index.ts                      ← Task 7.2
        gemini.ts                     ← Task 7.3
        openai.ts                     ← Task 7.4
        anthropic.ts                  ← Task 7.5
        openrouter.ts                 ← Task 7.6
        ollama.ts                     ← Task 7.7
        _shared.ts                    ← optional, Task 7.4 trade-off
    ```
    13 NEW files this story (12 if `_shared.ts` is not introduced).
  - [ ] 10.2 Verify NO files outside `src/lib/llm/` are touched by this story. Story 1.4's `lib/schemas/`, `lib/storage/`, `lib/result/` are READ but not modified. `src/app/`, `src/components/`, `src/features/` are completely untouched.
  - [ ] 10.3 Verify NO `package.json` changes — Story 1.1 already installed `ai`, `@ai-sdk/google`, `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@openrouter/ai-sdk-provider`, `ollama-ai-provider-v2`, `zod`. This story consumes them; it does not add new deps.
  - [ ] 10.4 Append a checklist into Dev Agent Record § Completion Notes confirming AC1–AC18 individually with one-line evidence each (file path + line, type-check output, grep-audit output, etc.).
  - [ ] 10.5 If any AC is observed to fail at review, do not silently ship. Stop, document the deviation in Dev Agent Record, and either fix or escalate per architecture line 873.
  - [ ] 10.6 Smoke-test deferred to consumer story: `generateParagraph` cannot be invoked yet — there is no UI calling it (Story 1.8 onboarding is the first caller; Story 1.10 Today route is the second). Story 1.5 ships the seam; consumers exercise it. **Do NOT** add a `_dev/components` page that calls a real LLM provider — that would require a real API key and is out of scope. If a TS-only sanity check is wanted, type-check (Task 9.1) is sufficient.

## Dev Notes

### Critical pre-read (read before writing any code)

> **Mandatory:** `architecture.md` lines 338–411 (§ API & Communication Patterns — the entire LLM seam contract: SDK call shape, provider abstraction, default models, error model, retry policy, rate limiting), 580–610 (§ Naming Patterns), 686–740 (§ Format Patterns — error format, Result pattern), 743–763 (§ Communication Patterns — state-management decision tree), 764–812 (§ Process Patterns — error handling, retry pattern, validation timing), 1078–1094 (§ Complete Project Tree — exact file placements for `src/lib/llm/`), 1126–1162 (§ Architectural Boundaries — layered import direction + data boundaries: LLM provider ↔ App boundary). Also `epics.md` lines 536–569 (Story 1.5 verbatim) + 165–189 (AR4, AR5, AR6, AR7, AR8, AR9, AR15, AR16, AR18, AR29). And `prd.md` lines 712, 724–727, 731–734 (FR1, FR10–FR13, FR17). The whole story is the LLM provider abstraction seam; the architecture is non-negotiable on call shape, error vocabulary, and retry policy.

### What this story owns vs. defers

This story creates the **LLM provider abstraction seam**. Every consumer (paragraph generation, offline-pack script via thinner wrapper, future error-recovery UI) goes through `generateParagraph()`. No later story re-implements provider selection, error parsing, or retry.

| Concern | This story | Future story |
|---|---|---|
| `generateParagraph(opts)` public API | Task 8 | Consumed by Story 1.8 (onboarding first-paragraph), Story 1.10 (Today screen manual generate), Story 4.1 (same-day cache reuse — first call paths through 1.10), Story 8.1 (offline-pack batch script — likely with its own thin wrapper since it doesn't share `getProvider(settings)`'s settings-driven shape) |
| `getProvider(settings)` provider construction seam | Task 6 | Consumed by Story 1.8, 1.10 — every per-call `model` resolution. Settings (Story 1.9) hot-swaps provider; the next `getProvider` call sees the new active provider |
| `MODEL_BY_PROVIDER` lookup | Task 3 | Story 1.9 may add per-provider model overrides via Settings (currently model is a hard-coded default per provider; if user wants `gemini-2.5-pro` instead of `gemini-2.5-flash`, Story 1.9 lifts that into Settings — not this story) |
| `withRetry` helper | Task 4 | Used only by `generate.ts` in MVP. Other layers (storage, audio) do NOT retry per architecture line 802 — they surface errors |
| Per-provider error parsers | Task 7 | Stable; new provider would add a 6th file + dispatcher branch, not modify existing parsers |
| `LlmError` discriminated union | Task 1 | Consumed by Story 1.12 (`<InlineErrorSurface />` 2-action variant for LLM errors), Story 8.4 (3-action variant adding "Use Offline Pack") |
| `paragraphSchema` (LLM response Zod) | Task 2 | Consumed only inside `generate.ts` (and indirectly by `useParagraphOfTheDay` Story 4.1 which writes to `paragraphCache` via `cachedParagraphSchema` — different schema, same `hardWordSchema` row shape) |
| Hard-scope-boundary `assertClientOnlySafeContext()` runtime guard in `client.ts` | ❌ deferred | Story 1.6 — adds the guard inside `client.ts` (this story creates `client.ts` with a placeholder comment marking the wiring point) |
| Streaming output (`streamText` / partial validation) | ❌ deferred | Per AR29 (epics line 190) and architecture line 367 — non-streaming for MVP. Schema-validated structured output cannot safely partial-validate mid-stream |
| Per-error `retryAfterMs` consumption in `withRetry` | ❌ deferred (recorded but not consumed) | The `LlmError.retryAfterMs` field is captured by the parsers (where the SDK provides it — e.g., OpenAI `Retry-After` header, Anthropic `retry-after`) but `withRetry` uses the deterministic `[1s, 3s]` schedule per architecture line 411. A future enhancement could honor `retryAfterMs` when present; defer until proven needed |
| Telemetry / logging | ❌ deferred (NFR16 forbids) | None; consumer decides logging |
| Tests | ❌ deferred (NFR26 — no test framework in MVP) | None; manual smoke-test via Story 1.8 onboarding |

**Why no tests:** NFR26 explicitly forbids a test framework in MVP. The validation strategy is: (a) TypeScript strict mode catches shape/typing errors, (b) Story 1.8 onboarding is the first end-to-end smoke test (manual: paste a Gemini key, click Generate, observe a paragraph render), (c) the per-provider parsers are exercised in production over time as Priyank hits various error states.

### Layered import compliance (AR18 — non-negotiable)

This story touches `src/lib/llm/` only. The compliance posture:

| File | Layer | May import from | This story imports |
|---|---|---|---|
| `src/lib/llm/types.ts` | `lib/` | type-only references to `ai`, `@/lib/schemas/provider-keys.schema`, `./schemas/paragraph.schema` | runtime: none |
| `src/lib/llm/schemas/paragraph.schema.ts` | `lib/` | `zod`, `@/lib/schemas/paragraph-cache.schema` (sibling `lib/`) | `zod`, `hardWordSchema` |
| `src/lib/llm/models.ts` | `lib/` | type-only `@/lib/schemas/provider-keys.schema` | (none runtime) |
| `src/lib/llm/with-retry.ts` | `lib/` | `@/lib/result` (sibling `lib/`), `./types` (type-only) | `Result`, `isErr`, `LlmError` |
| `src/lib/llm/prompts/paragraph.ts` | `lib/` | (none) | (none) |
| `src/lib/llm/client.ts` | `lib/` | `@ai-sdk/google`, `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@openrouter/ai-sdk-provider`, `ollama-ai-provider-v2`, `ai` (type-only `LanguageModel`), `@/lib/schemas/provider-keys.schema` (type-only), `./models` | provider SDKs + types |
| `src/lib/llm/errors/index.ts` | `lib/` | `@/lib/schemas/provider-keys.schema` (type-only), `../types`, sibling `./<provider>` | dispatcher only |
| `src/lib/llm/errors/<provider>.ts` | `lib/` | `../types` (type-only) | (none) |
| `src/lib/llm/errors/_shared.ts` (optional) | `lib/` | (none) | (none) |
| `src/lib/llm/generate.ts` | `lib/` | `ai`, `@/lib/result`, `./schemas/paragraph.schema`, `./prompts/paragraph`, `./errors`, `./with-retry`, `./types` | full pipeline |

**Verified absent imports** (must remain absent):
- `from '@/components/*'` in any `src/lib/llm/` file — `lib/` MUST NOT import from `components/` (architecture line 1140).
- `from '@/features/*'` in any `src/lib/llm/` file — same rule.
- `from '@/app/*'` in any `src/lib/llm/` file — same rule.
- `from '@ai-sdk/*'` / `from 'ai'` / `from '@openrouter/ai-sdk-provider'` / `from 'ollama-ai-provider-v2'` outside `src/lib/llm/` — provider SDKs are seam-confined (NFR27). Verified by Task 9.4.
- `generateObject` anywhere — deprecated (AR4). Verified by Task 9.3.

### Server vs. client component boundaries (architecture lines 421–428)

| File | Type | Rationale |
|---|---|---|
| `src/lib/llm/types.ts` | universal | Pure TS types, no React, no DOM. Server-and-client safe. |
| `src/lib/llm/schemas/paragraph.schema.ts` | universal | Pure Zod, no React, no DOM. |
| `src/lib/llm/models.ts` | universal | Pure constants. |
| `src/lib/llm/with-retry.ts` | universal | Pure async function. The `setTimeout` is universal (Node + browser). |
| `src/lib/llm/prompts/paragraph.ts` | universal | Pure string-build. |
| `src/lib/llm/client.ts` | **client-only de-facto** | Constructs provider SDK instances. SDKs internally call `fetch` — universal. **Do NOT** add `'use client'` to a non-component file (architecture line 426). The runtime guard in Story 1.6 (`assertClientOnlySafeContext()`) will hard-fail server-side construction; until then, this file is gated by being imported only from client contexts (the consuming UI is `'use client'`). |
| `src/lib/llm/errors/*.ts` | universal | Pure error normalization. |
| `src/lib/llm/generate.ts` | **client-only de-facto** | Calls `generateText` from `ai` SDK which uses `fetch`. Same posture as `client.ts` — no `'use client'` directive on a non-component file. |

**Why no SSR concerns ever (AR15 / NFR14):** This is a single-user client-only app. The `app/layout.tsx` server-component (Story 1.3) does NOT touch LLM code paths. Story 1.6 will add the `assertClientOnlySafeContext()` guard to `client.ts` to make accidental SSR import fail loudly. Until 1.6, the boundary is enforced by convention (consumers are all `'use client'`).

### TypeScript strict + AI SDK 6 typing pitfalls

1. **`LanguageModel` type from `ai`:** The `ai` package exports a `LanguageModel` type from its public surface (`import type { LanguageModel } from 'ai'`). The exact module path may differ across `ai@6.x.y` patch versions — if the import errors, fall back to `ai/core` or `ai/providers` and document. **Do NOT** declare a local placeholder type — the SDK's type is the contract.

2. **`Output.object({ schema })` field on result:** The Vercel AI SDK 6 result type for structured output uses `experimental_output` in some 6.x versions and `output` in others. The `callOnce` implementation reads from both fields defensively (Task 8.3). Verify against installed SDK's `.d.ts` and prefer the typed field; remove the other if TS errors fire. **Do NOT** use `as any` to silence — fix the type read.

3. **Provider-SDK factory shapes:**
   - `@ai-sdk/google`: `google({ apiKey })(modelId)` — factory returns a function that returns `LanguageModel`.
   - `@ai-sdk/openai`: `openai({ apiKey })(modelId)` — same shape.
   - `@ai-sdk/anthropic`: `anthropic({ apiKey })(modelId)` — same shape.
   - `@openrouter/ai-sdk-provider`: `createOpenRouter({ apiKey }).chat(modelId)` — factory exposes `.chat(modelId)` method (not a callable). Verify against installed version.
   - `ollama-ai-provider-v2`: `createOllama()(modelId)` — no API key. The `ollama-ai-provider-v2` is the maintained fork of the original `ollama-ai-provider` (community).
   
   Each SDK's exact constructor name (`createOpenAI` vs `openai`, `createGoogleGenerativeAI` vs `google`, etc.) MUST match the installed version's exports. Story 1.1's `pnpm add` is the source of truth — read the installed package's `index.d.ts` if uncertain.

4. **`@openrouter/ai-sdk-provider` chat-vs-completion:** OpenRouter exposes both chat and completion endpoints. Use the `.chat()` method for daily generation (matches the prompt-shaped call). The `.completion()` method is legacy.

5. **`LlmError.retryable` literal type narrowing:** In `withRetry`, the line `if (!lastResult.error.retryable) return lastResult;` narrows the result's `error.retryable` based on the discriminated union. After the early return, the remaining flow knows `error.retryable === true`. **Do NOT** widen `retryable` to `boolean` — narrowing breaks.

6. **Zod 3 vs 4 `.safeParse` return shape:** Zod 3's `safeParse` returns `{ success: true, data } | { success: false, error: ZodError }`. Zod 4 (if installed) returns the same shape but `error.issues` may differ slightly. Verify with `pnpm list zod` — Story 1.1 pinned Zod 3.x; the implementation matches.

7. **`switch` exhaustiveness via `never`:** The `default: const exhaustive: never = activeProvider` pattern in `client.ts` and `errors/index.ts` is the canonical TS exhaustive-check. **Do NOT** replace with `// @ts-expect-error` or runtime-only fallbacks — adding a new provider should hard-fail at compile time, forcing all switches to update.

8. **`as const` on `MODEL_BY_PROVIDER`:** The `as const` preserves the literal-type values (`'gemini-2.5-flash'` not widened to `string`). This lets future code do `if (modelId === 'gemini-2.5-flash')` with full type safety. **Do NOT** drop `as const` — it's not redundant.

### Likely dev-time pitfalls (preempt these)

1. **AI SDK 6 alpha → stable migration:** The `ai@6` package was pre-release for some time before stable. If `pnpm list ai` shows a `6.0.0-canary.X` or similar, the `experimental_output` field name applies; on stable `6.x.0`+, the field is `output`. The Task 8.2 `result.experimental_output ?? result.output` defensive read covers both. **Do NOT** upgrade or downgrade `ai` to "fix" — Story 1.1 pinned the version.

2. **OpenRouter base URL:** The OpenRouter SDK defaults to `https://openrouter.ai/api/v1` — no `baseURL` override needed in MVP. If a future user requests a custom base, add to `getProvider`'s OpenRouter branch via `createOpenRouter({ apiKey, baseURL })`. Document but defer.

3. **Ollama default base URL:** `http://localhost:11434` — the Ollama default. If the user runs Ollama on a non-default port, they need a Settings field for it (deferred to Story 1.9). MVP assumes default.

4. **Retry race conditions:** `withRetry`'s sequential `for` loop is safe — no concurrency. `setTimeout`-via-`sleep` is single-threaded. **Do NOT** introduce `Promise.race` / `AbortController` to "speed up" retries — it's out of scope and changes the deterministic-policy contract.

5. **AbortController support:** The `generate.ts` does NOT accept an `AbortSignal`. Future enhancement: `opts.signal?: AbortSignal` plumbed through `generateText({ signal })`. Defer until the UI needs cancellation (likely Story 1.10 if the user wants to cancel a slow generation). Architecture lines 873 — pattern change requires architecture-doc edit first.

6. **`paragraphSchema.safeParse` vs `parse`:** Always `safeParse`. Calling `.parse()` would throw a `ZodError` and bypass the `Result.err` path. **Do NOT** use `parse`.

7. **API key in console logs:** Some provider SDKs log requests at debug level — ensure no `console.log` instrumentation is added to `client.ts` or `generate.ts` (Task 9.8 grep audit). The redaction in Task 7.8 is a final defense; the primary defense is "don't log".

8. **`fetch` polyfill on Node:** Node 18.17+ (architecture line 155, the Next.js 16 minimum) ships `fetch` natively. No polyfill needed. **Do NOT** add `node-fetch` — it's a redundant dep.

9. **Static vs dynamic imports for providers:** All 5 provider SDKs are statically imported in `client.ts`. This means the bundle includes all 5 even when only one is active. For MVP, this is acceptable (≤500KB gzipped target per NFR — the AI SDK + 4 providers fits comfortably). Dynamic imports per provider could shave kilobytes but adds async complexity; **defer to a later optimization story** if bundle size grows past the NFR.

10. **`prompt` vs `messages` in `generateText`:** The SDK accepts either `prompt: string` (single user message) or `messages: ModelMessage[]` (full chat history). Story 1.5 uses the `prompt` form — single-shot, no chat memory. If a future story needs chat-style context (it shouldn't — paragraphs are single-shot), switch to `messages`. Architecture line 360 shows the `prompt` form.

### Pre-existing files this story modifies (UPDATE — read before editing)

**None.** Story 1.5 creates 12–13 NEW files in `src/lib/llm/` — all of which were `.gitkeep` placeholders after Story 1.1 Task 6.1.

**Files this story creates (NEW — 12 required, 1 optional):**

- `src/lib/llm/client.ts` (Task 6) — provider construction
- `src/lib/llm/generate.ts` (Task 8) — public seam
- `src/lib/llm/models.ts` (Task 3) — model lookup
- `src/lib/llm/with-retry.ts` (Task 4) — retry helper
- `src/lib/llm/types.ts` (Task 1) — `LlmError`, `GenerateParagraphOpts`
- `src/lib/llm/prompts/paragraph.ts` (Task 5) — prompt builder
- `src/lib/llm/schemas/paragraph.schema.ts` (Task 2) — LLM response Zod
- `src/lib/llm/errors/index.ts` (Task 7.2) — dispatcher
- `src/lib/llm/errors/gemini.ts` (Task 7.3)
- `src/lib/llm/errors/openai.ts` (Task 7.4)
- `src/lib/llm/errors/anthropic.ts` (Task 7.5)
- `src/lib/llm/errors/openrouter.ts` (Task 7.6)
- `src/lib/llm/errors/ollama.ts` (Task 7.7)
- `src/lib/llm/errors/_shared.ts` (Task 7.4 trade-off, OPTIONAL — adds shared `toErrShape` / `extractStatus` helpers; either keep duplication or extract; AC neutral)

**Files this story does NOT touch:**

- `src/app/layout.tsx` (Story 1.3 owns; Story 1.6 will add the HARD-SCOPE-BOUNDARY banner comment)
- `src/lib/storage/db.ts` (Story 1.4 owns)
- `src/lib/schemas/paragraph-cache.schema.ts` (Story 1.4 owns; this story IMPORTS `hardWordSchema` from it — read-only)
- `src/lib/schemas/provider-keys.schema.ts` (Story 1.4 owns; this story IMPORTS `ActiveProvider` and `ProviderKeys` types — read-only)
- `src/lib/result/index.ts` (Story 1.4 owns; this story IMPORTS `Result`, `ok`, `err`, `isErr`)
- `src/components/*` (no UI in 1.5)
- `src/features/*` (capability hooks come later — Story 1.10 first uses `generateParagraph` via `features/paragraph/use-generate-paragraph.ts`)
- `next.config.ts` (Story 1.6 owns the build-time guard)
- `package.json` (Story 1.1 already installed all deps)

### Capability-area discipline (NFR28 + AR19)

Story 1.5 lives entirely in `src/lib/llm/` — the **provider abstraction seam** (architecture line 1078). This is cross-cutting infra; it's not capability-area code. The reason: every paragraph-related capability (Story 1.10 Today, Story 4.1 cache, Story 8.1 offline-pack) consumes the same `generateParagraph()` API. If LLM logic lived in `features/paragraph/`, then the offline-pack script (`scripts/`) would have to either reach across the `features/` boundary (forbidden by AR18) or duplicate the seam. So `lib/llm/` is correct.

The `features/paragraph/use-generate-paragraph.ts` hook (Story 1.10) is a thin React-aware wrapper around `generateParagraph()` — handling loading state, settings derivation, error-surface dispatch. That's where capability code lives; the seam itself is infra.

### Provider SDK version notes (from architecture / Story 1.1 lock)

| Package | Pinned by | Notes |
|---|---|---|
| `ai` | Story 1.1 (`pnpm add ai`) | AI SDK 6.x; provides `generateText`, `Output.object`, `LanguageModel` type |
| `@ai-sdk/google` | Story 1.1 | Default provider; uses `gemini-2.5-flash` via `MODEL_BY_PROVIDER.gemini` |
| `@ai-sdk/openai` | Story 1.1 | Settings-overridable |
| `@ai-sdk/anthropic` | Story 1.1 | Settings-overridable |
| `@openrouter/ai-sdk-provider` | Story 1.1 | Note: epics line 164 / Story 1.1 AR3 specifies this exact name (NOT `openrouter` or `@openrouter/openrouter`) |
| `ollama-ai-provider-v2` | Story 1.1 | Maintained fork; epics line 164 / Story 1.1 AR3 specifies the `-v2` suffix |
| `zod` | Story 1.1 | 3.x range; consumed by `paragraphSchema` |

**If any of the provider SDK names fail to import** (e.g., the package was renamed or unpublished between Story 1.1 lock and Story 1.5 implementation), fix Story 1.1 first by adjusting the `pnpm add` line and lockfile — don't substitute a different package here. Architecture line 873 — version drift requires architecture-doc edit first.

### Project Structure Notes

**Alignment with `architecture.md § Complete Project Tree` lines 1078–1094:** All 12 (or 13 with `_shared.ts`) new file paths match the tree exactly. The tree explicitly lists each file by name + responsibility — Story 1.5 produces them 1:1.

**Detected conflicts or variances:**

- **`hardWordSchema` location:** Architecture line 1087 lists `lib/llm/schemas/paragraph.schema.ts` AND line 1104 lists `lib/schemas/paragraph-cache.schema.ts`. The same `hardWords` shape needs to live in both contexts (LLM response validation + persisted cache). Per Story 1.4's resolution (1.4 dev-notes line 822), `hardWordSchema` is OWNED by `lib/schemas/paragraph-cache.schema.ts`; Story 1.5's `paragraph.schema.ts` IMPORTS it. **Variance acknowledged in 1.4** — Story 1.5 honors the resolution; the LLM-side schema is a wrapper that includes the prompt-output envelope (`paragraph + hardWords[]`), not a redefinition of the row shape.
- **`errors/_shared.ts`:** Architecture line 1088 lists `errors/index.ts` and per-provider files but does NOT enumerate `_shared.ts`. Story 1.5 may introduce it as an implementation-detail extraction (Task 7.4). Acceptable per architecture line 873 — file additions for de-duplication are implementation freedom as long as no public API surface changes.
- **`MODEL_BY_PROVIDER` exhaustiveness:** Architecture line 393 hard-codes `gemini-2.5-flash` for runtime. The other 4 providers don't have architecture-mandated default models — Story 1.5 chooses sensible defaults (Task 3.2) that Settings (Story 1.9) can override. Variance acknowledged: this is implementation freedom, not architecture deviation. The architectural contract is `MODEL_BY_PROVIDER` exists as a `Record<ActiveProvider, string>` (architecture lines 372–377 imply via tree); the literal values for non-Gemini are dev choice.
- **`createOpenRouter({ apiKey }).chat(modelId)` shape vs. the symmetrical factory shape:** Architecture line 372 doesn't specify the OpenRouter factory shape. The `.chat()` method form is the SDK's own convention. If the installed SDK's TS types differ (e.g., callable factory `openrouter({ apiKey })(modelId)`), use the SDK-provided form and document. Variance acknowledged.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` § Story 1.5 (lines 536–569)] — verbatim acceptance criteria source
- [Source: `_bmad-output/planning-artifacts/epics.md` § Additional Requirements AR4 (line 165)] — AI SDK 6 `generateText` + `Output.object` (NOT `generateObject`)
- [Source: `_bmad-output/planning-artifacts/epics.md` § Additional Requirements AR5 (line 166)] — default `gemini-2.5-flash` for runtime
- [Source: `_bmad-output/planning-artifacts/epics.md` § Additional Requirements AR6 (line 167)] — provider abstraction seam in `src/lib/llm/generate.ts`
- [Source: `_bmad-output/planning-artifacts/epics.md` § Additional Requirements AR7 (line 168)] — per-provider error parsers + `LlmError` discriminated union
- [Source: `_bmad-output/planning-artifacts/epics.md` § Additional Requirements AR8 (line 169)] — `withRetry` ≤2 attempts with `[1s, 3s]`, retryable-only
- [Source: `_bmad-output/planning-artifacts/epics.md` § Additional Requirements AR9 (line 170)] — `Result<T, E>` discriminated union; throw-only-for-programmer-errors
- [Source: `_bmad-output/planning-artifacts/epics.md` § Additional Requirements AR15 (line 175)] — hard-scope-boundary three-layer guard (runtime guard in `lib/llm/client.ts` deferred to Story 1.6)
- [Source: `_bmad-output/planning-artifacts/epics.md` § Additional Requirements AR16 (line 177)] — Zod single source of truth (no parallel TS types; `hardWordSchema` shared between LLM and cache schemas)
- [Source: `_bmad-output/planning-artifacts/epics.md` § Additional Requirements AR18 (line 179)] — layered import direction (provider SDKs confined to `lib/llm/`)
- [Source: `_bmad-output/planning-artifacts/epics.md` § Additional Requirements AR29 (line 190)] — non-streaming for MVP
- [Source: `_bmad-output/planning-artifacts/architecture.md` § API & Communication Patterns (lines 338–411)] — full LLM seam contract (call shape, abstraction, error model, retry, rate limiting)
- [Source: `_bmad-output/planning-artifacts/architecture.md` § Authentication & Security (lines 302–336)] — provider key vault layout (`ProviderKeys`, `ActiveProvider`)
- [Source: `_bmad-output/planning-artifacts/architecture.md` § Naming Patterns (lines 580–610)] — file naming, symbol naming, discriminated union conventions
- [Source: `_bmad-output/planning-artifacts/architecture.md` § Format Patterns (lines 686–740)] — `Result` pattern, `LlmError` shape, JSON field naming (camelCase)
- [Source: `_bmad-output/planning-artifacts/architecture.md` § Communication Patterns (lines 743–763)] — state-management decision tree (no global LLM client state)
- [Source: `_bmad-output/planning-artifacts/architecture.md` § Process Patterns — error handling + retry pattern + validation timing (lines 764–812)] — error rendering, retry-only-for-LLM, schema validation timing
- [Source: `_bmad-output/planning-artifacts/architecture.md` § Complete Project Tree (lines 1078–1094)] — exact file placements for `src/lib/llm/`
- [Source: `_bmad-output/planning-artifacts/architecture.md` § Architectural Boundaries (lines 1126–1162)] — layered import direction; LLM provider ↔ App data boundary
- [Source: `_bmad-output/planning-artifacts/architecture.md` § Pattern Examples — Anti-Patterns (lines 875–929)] — anti-patterns (throwing for app errors, parallel TS types, etc.)
- [Source: `_bmad-output/planning-artifacts/prd.md` § Functional Requirements FR1, FR10, FR11, FR12, FR13 (lines 712, 724–727)] — provider selection, abstraction, error parsing, retry policy, structured JSON
- [Source: `_bmad-output/planning-artifacts/prd.md` § Functional Requirements FR15, FR16, FR17 (lines 732–734)] — recycle-words generation, cold-start, malformed-response handling
- [Source: `_bmad-output/planning-artifacts/prd.md` § Non-Functional Requirements NFR2 (line 811)] — <15s first-paragraph end-to-end (mitigated by retry + offline-pack fallback)
- [Source: `_bmad-output/planning-artifacts/prd.md` § Non-Functional Requirements NFR14 (line 829)] — API keys in localStorage; n=1 boundary (informs the Story 1.6 placeholder comment)
- [Source: `_bmad-output/planning-artifacts/prd.md` § Non-Functional Requirements NFR27 (line 848)] — provider-swap reversibility (zero code changes — Settings interaction only)
- [Source: `_bmad-output/implementation-artifacts/1-1-project-scaffold-and-agent-configuration.md`] — previous epic-1 story; created `src/lib/llm/{errors,prompts,schemas}/` empty placeholder folders + installed all 5 provider SDKs + `ai` + `zod` (Story 1.5 dep contract)
- [Source: `_bmad-output/implementation-artifacts/1-2-visual-token-system-typography-and-self-hosted-fonts.md`] — informational only (no styling concerns in 1.5)
- [Source: `_bmad-output/implementation-artifacts/1-3-root-layout-shell-topnav-dayrail-skeleton-statrail-skeleton-and-honesty-footer.md`] — informational only (no UI in 1.5; Story 1.10 Today route is the first consumer)
- [Source: `_bmad-output/implementation-artifacts/1-4-storage-foundations-dexie-schema-uselocalstorage-hook-base-zod-schemas.md`] — IMMEDIATELY PREVIOUS story; established `Result`, `hardWordSchema` (consumed here), `ActiveProvider` / `ProviderKeys` types (consumed here), `useLocalStorage` hook (consumed by future Story 1.8/1.9 callers, NOT by this seam)

## Dev Agent Record

### Context Reference

- This story spec is self-contained. The dev agent should read this file plus the four planning artifacts referenced above (epics.md, architecture.md, ux-design-specification.md sections referenced as informational, prd.md) and the four prior story files (1-1, 1-2, 1-3, 1-4). UX-design-specification.md is informational only for 1.5 — there is NO UI in this story; later stories (Story 1.10 Today, Story 1.12 InlineErrorSurface) wire `generateParagraph` and `LlmError` into UI components.
- Previous stories: `1-1-project-scaffold-and-agent-configuration.md` (status: ready-for-dev), `1-2-visual-token-system-typography-and-self-hosted-fonts.md` (status: ready-for-dev), `1-3-root-layout-shell-topnav-dayrail-skeleton-statrail-skeleton-and-honesty-footer.md` (status: ready-for-dev), `1-4-storage-foundations-dexie-schema-uselocalstorage-hook-base-zod-schemas.md` (status: ready-for-dev). Story 1.4 is the IMMEDIATE prerequisite — Story 1.5 imports `hardWordSchema` from `@/lib/schemas/paragraph-cache.schema`, `ActiveProvider`/`ProviderKeys` from `@/lib/schemas/provider-keys.schema`, and `Result`/`ok`/`err`/`isErr` from `@/lib/result`. If 1.4 has not been implemented, complete it first.
- No `project-context.md` files were found in the workspace at story-creation time.
- No git history exists at story-creation time; no prior code patterns to inherit beyond what 1.1–1.4 produce on disk.

### Previous Story Intelligence

Story 1.4 (Storage Foundations — Dexie Schema, useLocalStorage Hook, Base Zod Schemas) established the persistence substrate Story 1.5 leans on. From 1.4's Dev Notes § What this story owns vs. defers:

| 1.4 produced | 1.5 uses |
|---|---|
| `Result<T, E>` type + `ok`, `err`, `isErr`, `map`, `mapErr` helpers in `src/lib/result/index.ts` | `generate.ts` returns `Result<ParagraphResult, LlmError>`; `with-retry.ts` consumes `isErr`; `ok`/`err` constructors used throughout |
| `hardWordSchema` row Zod (`{ word, ipa, meaning, exampleSentence }`) in `src/lib/schemas/paragraph-cache.schema.ts` | `paragraph.schema.ts` imports `hardWordSchema` directly; never redefines |
| `ActiveProvider` enum (`'gemini' \| 'openai' \| 'anthropic' \| 'openrouter' \| 'ollama'`) in `src/lib/schemas/provider-keys.schema.ts` | `client.ts` switches on `activeProvider`; `errors/index.ts` dispatches on it; `models.ts` keys `MODEL_BY_PROVIDER` by it |
| `ProviderKeys` shape (`{ gemini?, openai?, anthropic?, openrouter?, ollama: null }`) | `client.ts.requireKey` reads from `providerKeys[activeProvider]` (with type-narrowing via switch) |
| `Settings` shape (`{ theme, persona, length, retention, voiceURI }`) | NOT directly consumed in 1.5 (caller derives `theme/persona/length` from settings; `generateParagraph(opts)` takes them as plain fields). Story 1.10's `use-generate-paragraph.ts` projects `Settings` → `GenerateParagraphOpts` |
| `useLocalStorage<T>` hook | NOT consumed in 1.5 — the LLM seam is settings-agnostic; hooks live in `features/` |
| `db.paragraphCache` table (Dexie) | NOT consumed in 1.5 — caching is a Story 4.1 concern; `generate.ts` returns the freshly-validated `ParagraphResult` for the caller to write |

**Patterns established by 1.4 to honor here:**

- **Named exports always.** Every type, function, schema — all named. No `export default`.
- **Layered-import compliance audited via grep.** Story 1.5 applies the same audit pattern: `lib/llm/` MUST NOT import from `components/`, `features/`, or `app/`.
- **`'use client'` only when needed.** Story 1.5 has zero React components, zero hooks. NO file in `lib/llm/` gets a `'use client'` directive.
- **JSDoc on `lib/` public exports.** Architecture line 838. Story 1.5 documents `LlmError`, `paragraphSchema`, `getProvider`, `generateParagraph`, `withRetry`, `parseLlmError`, `MODEL_BY_PROVIDER`, `buildPrompt`.
- **Architecture references inline as `[Source: ...]`.** Every dev-note claim cites the exact architecture/epics/prd line range.
- **No `package.json` changes.** Story 1.1 installed every dep needed for the entire MVP. Stories 1.2–1.5 ADD ZERO new deps.
- **Result-shaped fallible operations.** `generateParagraph` mirrors Story 1.4's `safeWrite` pattern (architecture line 729): "All app-layer errors are discriminated unions returned via Result-shaped functions, not thrown."

**Patterns from earlier stories:**

- Story 1.3 — Server/client component boundaries (`'use client'` only when needed) — Story 1.5 follows: every file is universal/non-component.
- Story 1.2 — Token discipline irrelevant (no UI in 1.5).
- Story 1.1 — File naming (`kebab-case.ts` for lib modules, `*.schema.ts` for Zod), banned-deps posture (zero new deps).

**Likely 1.1–1.4 review cycles to anticipate before starting 1.5:**

- If `pnpm list ai @ai-sdk/google @ai-sdk/openai @ai-sdk/anthropic @openrouter/ai-sdk-provider ollama-ai-provider-v2 zod` reveals any package missing or wrong-name, fix Story 1.1 first.
- If `src/lib/llm/{errors,prompts,schemas}/` folders don't exist (Story 1.1 Task 6.1 not yet implemented), create them with `.gitkeep` files first OR finish 1.1 first.
- If `src/lib/result/index.ts` doesn't export `Result`/`ok`/`err`/`isErr`, fix Story 1.4 first.
- If `src/lib/schemas/paragraph-cache.schema.ts` doesn't export `hardWordSchema`, fix Story 1.4 first.
- If TS strict mode is not enabled (`tsconfig.json` `"strict": true`), all type narrowing falls apart — verify Story 1.1's tsconfig before starting.

**Critical handoff rule:** Story 1.6 modifies `src/lib/llm/client.ts` to add `assertClientOnlySafeContext()`. Story 1.5's placeholder comment (Task 6.2 top-of-file block) is the wiring marker. Do NOT ship the runtime guard in 1.5 — that's 1.6's scope and removing the placeholder loses the marker.

### Agent Model Used

Composer (Cursor subagent).

### Debug Log References

(none)

### Completion Notes List

- **AC1:** `generateParagraph` exported from `src/lib/llm/generate.ts` — `Promise<Result<ParagraphResult, LlmError>>`, opts use `GenerateParagraphOpts` from `types.ts`; SDK throws → `err(parseLlmError(...))`.
- **AC2:** `generate.ts` uses `generateText` + `Output.object({ schema: paragraphSchema })`; workspace grep: no `generateObject` in `src/`.
- **AC3:** `src/lib/llm/schemas/paragraph.schema.ts` imports `hardWordSchema` from `@/lib/schemas/paragraph-cache.schema`; `paragraph` min(1), `hardWords` min(1).max(10).
- **AC4:** `getProvider` in `client.ts`; per-provider factories — `createGoogleGenerativeAI` / `createOpenAI` / `createAnthropic` / `createOpenRouter().chat` / `createOllama()()`. (Pinned SDK uses factory `create*` + `.chat` where curried `{ apiKey }(modelId)` is not the export shape.)
- **AC5:** `MODEL_BY_PROVIDER` in `models.ts`; `gemini: 'gemini-2.5-flash'`; `satisfies Record<ActiveProvider, string>`.
- **AC6:** Only `src/lib/llm/**` imports `ai`, `@ai-sdk/*`, `@openrouter/ai-sdk-provider`, `ollama-ai-provider-v2` — grep of `src/` excluding `llm` is clean.
- **AC7–AC9:** Five parsers under `errors/*.ts` + `parseLlmError` in `errors/index.ts`; OpenRouter delegates to `parseOpenAiError` after HTTP 402 branch.
- **AC8:** `LlmError` in `types.ts` matches architecture literals for `retryable`.
- **AC10–AC12:** `with-retry.ts`: default `maxAttempts = backoffMs.length + 1` (3), backoff `[1000, 3000]`; non-retryable immediate return; last error returned on exhaustion.
- **AC13:** `malformed_response` with `providerCode: 'zod_validation_failed'`, `retryable: true` from `paragraphSchema.safeParse` after `generateText`.
- **AC14:** `prompts/paragraph.ts` — `buildPrompt` per theme/persona/length/recycle/camelCase/hardWords row instructions.
- **AC15:** `generateParagraph` → `withRetry(() => callOnce(...))` with try/catch on `generateText` only.
- **AC16:** Placeholder comment block in `client.ts` for Story 1.6 `assertClientOnlySafeContext()`.
- **AC17:** `pnpm exec tsc --noEmit` exit 0; `pnpm build` exit 0.
- **AC18:** No `src/lib/llm/` imports from `@/components/`, `@/features/`, or `@/app/` — grep clean.

### File List

**Created (Story 1.5):**

- `src/lib/llm/types.ts`
- `src/lib/llm/schemas/paragraph.schema.ts`
- `src/lib/llm/models.ts`
- `src/lib/llm/with-retry.ts`
- `src/lib/llm/prompts/paragraph.ts`
- `src/lib/llm/client.ts`
- `src/lib/llm/generate.ts`
- `src/lib/llm/errors/index.ts`
- `src/lib/llm/errors/_shared.ts`
- `src/lib/llm/errors/gemini.ts`
- `src/lib/llm/errors/openai.ts`
- `src/lib/llm/errors/anthropic.ts`
- `src/lib/llm/errors/openrouter.ts`
- `src/lib/llm/errors/ollama.ts`

**Read-only dependencies:** `src/lib/schemas/paragraph-cache.schema.ts`, `src/lib/schemas/provider-keys.schema.ts`, `src/lib/result/index.ts`
