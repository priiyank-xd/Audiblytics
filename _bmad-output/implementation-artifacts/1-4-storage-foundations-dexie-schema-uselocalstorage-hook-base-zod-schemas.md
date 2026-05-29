# Story 1.4: Storage Foundations — Dexie Schema, useLocalStorage Hook, Base Zod Schemas

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Priyank,
I want the IndexedDB schema (`AudiblyticsDB` Dexie class), the namespaced `useLocalStorage<T>(key, default, schema)` hook, the `Result<T,E>` discriminated-union helpers, and all 9 base Zod schemas (`settings`, `provider-keys`, `collection`, `recording`, `paragraph-cache`, `offline-pack`, `day14-state`, `days-of-use`, `completions`) wired into `src/lib/`,
so that every subsequent persistence story (1.5 LLM cache, 1.8 onboarding, 1.9 settings, 2.1 collection, 3.1 recordings, 4.1 paragraph cache, 4.2 completions, 7.4 day14, 8.2 offline pack) consumes the exact same validated, single-source-of-truth shapes — making schema drift and silent data corruption structurally impossible.

## Acceptance Criteria

> Sourced verbatim from `epics.md § Story 1.4` (lines 502–533). Re-formatted as numbered AC for traceability against tasks.

1. **AC1 — `AudiblyticsDB` Dexie class with version(1).stores:** `src/lib/storage/db.ts` exports an `AudiblyticsDB` class extending `Dexie`. The constructor calls `super('audiblytics')` and `this.version(1).stores({...})` declaring the four tables with the exact indexes from AR10 (epics line 171, architecture lines 269–288): `collection: '++id, savedAt, lastReviewedAt, word'`, `recordings: '++id, recordingDate, paragraphId, dayOfUse'`, `paragraphCache: '++id, generatedAt, theme, persona'`, `offlinePack: '++id, theme, persona, lastSurfacedAt'`. Each table is typed via `Table<RecordType, KeyType>` using the inferred-from-Zod record types from `src/lib/schemas/`. Forward-only migration policy — no `.upgrade()` callback in v1 (architecture line 296).

2. **AC2 — Singleton `db` instance exported:** `src/lib/storage/db.ts` exports a module-level `export const db = new AudiblyticsDB();` so every call site uses the same instance (architecture line 1180, epics line 513). Re-importing from any module yields the identical singleton; no per-component instantiation.

3. **AC3 — `verifyOnLoad()` helper validates persisted records, logs drift:** `src/lib/storage/db.ts` exports an `async verifyOnLoad(): Promise<void>` helper that, once at app load, iterates each Dexie table, samples each record through its corresponding Zod schema (`collectionWordSchema`, `recordingSchema`, `cachedParagraphSchema`, `offlinePackEntrySchema`), and logs (via `console.warn`) any validation failures with the table name + record id + parsed Zod issue list (per AR17 architecture line 811). It MUST `console.warn` — not `throw` — so a single corrupted row does not brick app load (epics line 514).

4. **AC4 — `useLocalStorage<T>` hook exported with full signature:** `src/lib/storage/use-local-storage.ts` exports `useLocalStorage<T>(key: string, defaultValue: T, schema: z.ZodType<T>): readonly [T, (value: T | ((prev: T) => T)) => void]` (per AR12 epics line 173). The setter accepts either a value or an updater function (matching `useState`'s contract). Hook returns a tuple typed `readonly` to discourage destructuring mutation.

5. **AC5 — Hook validates reads through Zod schema; returns `defaultValue` on validation failure:** When the hook reads from `window.localStorage.getItem(key)` on mount (or in response to a `storage` event), it `JSON.parse`s the raw string and runs `schema.safeParse(parsed)`. If `safeParse` returns `success: false` (or JSON parse throws), the hook returns `defaultValue` AND logs the validation failure via `console.warn` with the key + Zod issue list (per AR17, NFR16 — no telemetry, console only). The corrupted localStorage value is NOT auto-overwritten — that is the user's data and the next setter call will replace it cleanly.

6. **AC6 — Hook listens for `storage` event for cross-tab sync:** The hook attaches a `window.addEventListener('storage', handler)` listener inside its first `useEffect`, removes it on unmount, and re-runs validation + state-update when an event fires for a matching `e.key`. This satisfies the "cross-component reactive KV" data-flow contract (architecture line 749). Note: `storage` event fires across tabs of the same origin but NOT in the originating tab — the in-tab setter must update its own state directly (Task 4.4).

7. **AC7 — Bare keys throw a programmer-error assertion at hook construction:** All `key` arguments MUST be prefixed `audiblytics.` (per AR11 epics line 172). The hook MUST assert this at the very top of its body — `if (!key.startsWith('audiblytics.')) throw new Error(\`useLocalStorage: key '${key}' must be prefixed 'audiblytics.' — see architecture.md § Naming Patterns lines 612–625\`)`. This is a programmer error per architecture line 737 — throwing is correct here (assertion failure / never-reached branch); it is caught by the route-level `error.tsx` boundary if it ever fires in production.

8. **AC8 — Raw `window.localStorage` access absent from the rest of the codebase:** A grep audit `rg -n "window\.localStorage\.(getItem|setItem|removeItem|clear)" src/ --glob '!src/lib/storage/use-local-storage.ts'` returns ZERO matches. Only `src/lib/storage/use-local-storage.ts` may touch `window.localStorage` directly (per AR12, architecture line 1154). This rule is non-negotiable — every future story that needs localStorage MUST go through this hook.

9. **AC9 — All 9 Zod schemas exist in `src/lib/schemas/`:** The folder contains exactly the following 9 files (architecture lines 1099–1108, epics line 526), each with the correct field set:
   - `settings.schema.ts` — `{ theme, persona, length, retention, voiceURI }` (FR4–FR8)
   - `provider-keys.schema.ts` — `{ gemini?, openai?, anthropic?, openrouter?, ollama: null }` (FR9)
   - `collection.schema.ts` — exactly the 10 fields from architecture lines 691–708 (id, word, ipa, meaning, exampleSentence, savedAt, sourceParagraphId, reviewCount, lastReviewedAt, difficultyRating) (FR21, FR26)
   - `recording.schema.ts` — `{ id, recordingDate, paragraphId, durationMs, mimeType, blob, dayOfUse }` (FR31, FR34)
   - `paragraph-cache.schema.ts` — `{ id, paragraph, hardWords[], theme, persona, generatedAt }` (FR19, FR21)
   - `offline-pack.schema.ts` — `{ id, paragraph, hardWords[], theme, persona, lastSurfacedAt }` (FR62, FR63)
   - `day14-state.schema.ts` — `{ fired: boolean, result: 'yes' | 'no' | null }` (FR39, FR40)
   - `days-of-use.schema.ts` — `string[]` of UTC ISO date `YYYY-MM-DD` (NFR12, NFR13)
   - `completions.schema.ts` — `Record<string, { hasReadIt, hasRecording, usedOfflinePack }>` keyed by UTC date (FR53, FR59)

10. **AC10 — Each schema exports BOTH the Zod schema AND the inferred TypeScript type:** Every file in `src/lib/schemas/` exports `xxxSchema` (Zod) AND `type Xxx = z.infer<typeof xxxSchema>` (per AR16 epics line 177, architecture line 607). Hand-written parallel TS types for the same shape are FORBIDDEN. Verified by grepping every schema file for `export const \w+Schema` AND `export type \w+ = z\.infer<` — both must appear.

11. **AC11 — Dexie write failure surfaces `Result<T, StorageError>`:** A `safeWrite<T>(fn: () => Promise<T>): Promise<Result<T, StorageError>>` helper exists in `src/lib/storage/db.ts` that wraps Dexie writes in `try/catch` and returns `{ ok: false, error: { kind: 'quota_exceeded' | 'access_denied' | 'unknown', message } }` on failure (per AR9 epics line 170, AR25 epics line 186, NFR8). When `e.name === 'QuotaExceededError'` (or `e instanceof DOMException` with `e.name` matching) the error `kind` is `'quota_exceeded'`. When `e.name === 'NotAllowedError'` or `'SecurityError'`, kind is `'access_denied'`. Otherwise `'unknown'`.

12. **AC12 — Failure never silently swallowed:** `safeWrite` MUST `console.error` (with the original error + serialized message) BEFORE returning `Result.err`, so a developer trace exists even when the call site decides to surface the error to the user via `<InlineErrorSurface variant="storage" />` (epics line 532). Catch blocks that return `{ ok: false, ... }` without the `console.error` are an AC failure.

13. **AC13 — `Result<T, E>` helpers exist in `src/lib/result/index.ts`:** Per architecture line 1117–1118 + AR9, the file exports the `Result<T, E>` type alias AND the helpers `ok<T>(value: T): Result<T, never>`, `err<E>(error: E): Result<never, E>`, plus optional `map<T,U,E>(r, fn)` / `mapErr<T,E,F>(r, fn)`. This is a prerequisite for AC11 (the storage layer is the FIRST consumer of `Result`; subsequent stories — 1.5 LLM, 3.1 recorder — also depend on it). Without this helper module, every fallible operation in the codebase has no canonical shape.

14. **AC14 — `pnpm build` succeeds with zero new TypeScript errors:** With all new files in place, `pnpm build` exits 0. TypeScript strict mode (architecture line 417) catches any `z.infer<>` mismatches against the Dexie `Table<T>` generic parameter — they MUST be reconciled BEFORE the story ships. Specifically `Table<CollectionWord, string>` requires `CollectionWord` (from collection.schema.ts) to have an `id: string` field (the `++id` auto-increment in the stores string is a Dexie convention; the actual TS type still has `id: string`).

15. **AC15 — Zero runtime imports outside `lib/` layered direction:** The only import paths used by files in `src/lib/storage/` and `src/lib/schemas/` and `src/lib/result/` are: third-party (`dexie`, `zod`, `react`), `@/lib/schemas/*`, `@/lib/result`, `@/lib/storage/*`. NO imports from `@/components/`, `@/features/`, or `@/app/` (per AR18 epics line 179, architecture lines 1140, 1143). Verified by grep.

### BDD format (verbatim mirror of `epics.md § Story 1.4` lines 510–533)

**Given** `src/lib/storage/db.ts` is opened
**When** the file is read
**Then** an `AudiblyticsDB` Dexie class exists with `version(1).stores({...})` declaring `collection`, `recordings`, `paragraphCache`, `offlinePack` tables with the indexes from AR10 (e.g. `collection: '++id, savedAt, lastReviewedAt, word'`)
**And** a singleton `db` instance is exported
**And** a `verifyOnLoad()` helper validates persisted records against their Zod schemas once at app load and logs (not throws) any drift (per AR17)

**Given** `src/lib/storage/use-local-storage.ts` is opened
**When** the file is read
**Then** `useLocalStorage<T>(key, defaultValue, schema)` is exported (per AR12)
**And** the hook validates reads through the provided Zod schema, returning `defaultValue` on validation failure
**And** the hook listens for the `storage` event for cross-tab sync
**And** all `key` values must be prefixed `audiblytics.*` (per AR11) — bare keys throw a programmer-error assertion at hook construction
**And** raw `window.localStorage.getItem`/`setItem` calls outside this hook are absent from the rest of the codebase (verified by grep audit)

**Given** `src/lib/schemas/` is inspected
**When** the folder contents are listed
**Then** `settings.schema.ts` (FR4–FR8 fields), `provider-keys.schema.ts` (FR9 vault), `collection.schema.ts` (FR26 placeholder for E2), `recording.schema.ts` (FR31 placeholder for E3), `paragraph-cache.schema.ts` (FR19 placeholder for E4), `offline-pack.schema.ts` (FR62 placeholder for E8), `day14-state.schema.ts` (FR39 placeholder for E7), `days-of-use.schema.ts` (NFR12 placeholder for E3), and `completions.schema.ts` (FR53 placeholder for E4) exist
**And** each schema exports both the Zod schema and the inferred TypeScript type via `z.infer<>` (per AR16)

**Given** a developer triggers any Dexie write
**When** the write fails with `QuotaExceededError` (simulated)
**Then** the operation returns a `Result<T, StorageError>` with `kind: 'quota_exceeded'` (per AR9, AR25, NFR8)
**And** the failure is never silently swallowed

## Tasks / Subtasks

- [ ] **Task 1 — Build `Result<T, E>` helper module** (AC: 13)
  - [ ] 1.1 Create `src/lib/result/index.ts`. The file is a tiny utility with no dependencies — pure types + factory functions. JSDoc the public exports per architecture line 838 (lib/ public exports require JSDoc).
  - [ ] 1.2 Implementation:
    ```ts
    /**
     * Discriminated-union result type for all fallible operations in Audiblytics.
     * Throwing is reserved for programmer errors only — see architecture.md § Process Patterns
     * (lines 729–737) and AR9 (epics line 170).
     */
    export type Result<T, E> =
      | { ok: true;  value: T }
      | { ok: false; error: E };

    /** Construct a successful result. */
    export function ok<T>(value: T): Result<T, never> {
      return { ok: true, value };
    }

    /** Construct a failed result. */
    export function err<E>(error: E): Result<never, E> {
      return { ok: false, error };
    }

    /** Map the success value, leaving errors untouched. */
    export function map<T, U, E>(r: Result<T, E>, fn: (v: T) => U): Result<U, E> {
      return r.ok ? ok(fn(r.value)) : r;
    }

    /** Map the error, leaving success untouched. */
    export function mapErr<T, E, F>(r: Result<T, E>, fn: (e: E) => F): Result<T, F> {
      return r.ok ? r : err(fn(r.error));
    }

    /** True iff the result is ok. */
    export function isOk<T, E>(r: Result<T, E>): r is { ok: true; value: T } {
      return r.ok;
    }

    /** True iff the result is err. */
    export function isErr<T, E>(r: Result<T, E>): r is { ok: false; error: E } {
      return !r.ok;
    }
    ```
  - [ ] 1.3 NEVER throw inside `ok()` / `err()` / map helpers. They are pure constructors.
  - [ ] 1.4 NEVER add an "unwrap" helper that throws on err. The whole point of Result is callers must handle both branches; an unwrap escape-hatch defeats the type discipline.
  - [ ] 1.5 Confirm zero imports from outside `lib/` (file is dependency-free).

- [ ] **Task 2 — Build the 9 Zod schemas in `src/lib/schemas/`** (AC: 9, 10, 15)
  - [ ] 2.1 Create `src/lib/schemas/settings.schema.ts`. Source-of-truth field set is FR4 (theme), FR4 (persona), FR5 (length 100–200 default 150), FR6 (retention 90-day-rolling/indefinite default 90-day-rolling), FR8 (voiceURI nullable, no default — per FR8 the highest-quality English voice is selected by default at runtime, so `null` here means "use default").
    ```ts
    import { z } from 'zod';

    export const themeSchema = z.enum([
      'horror', 'comedy', 'adventure', 'mystery', 'sci-fi', 'slice-of-life',
    ]);
    export type Theme = z.infer<typeof themeSchema>;

    export const personaSchema = z.enum([
      'gre-aspirant', 'business-english', 'storyteller', 'casual-conversationalist',
    ]);
    export type Persona = z.infer<typeof personaSchema>;

    export const retentionPolicySchema = z.enum(['90-day-rolling', 'indefinite']);
    export type RetentionPolicy = z.infer<typeof retentionPolicySchema>;

    export const settingsSchema = z.object({
      theme:     themeSchema.default('adventure'),
      persona:   personaSchema.default('storyteller'),
      length:    z.number().int().min(100).max(200).default(150),
      retention: retentionPolicySchema.default('90-day-rolling'),
      voiceURI:  z.string().nullable().default(null),
    });
    export type Settings = z.infer<typeof settingsSchema>;
    ```
    Notes:
    - Theme/persona enums use `kebab-case` string literals matching architecture line 605 ("snake_case values" — actually the example uses `'rate_limit'` snake_case, but the values shown in PRD/epics use `kebab-case` for theme/persona; preserve the kebab forms used throughout PRD). Cross-check: PRD line 715 lists `horror, comedy, adventure, mystery, sci-fi, slice-of-life` and `GRE Aspirant, Business English, Storyteller, Casual Conversationalist` — the latter are display labels; persisted enum values should be a stable lowercase form. Choose `kebab-case` for both (consistent with `90-day-rolling`).
    - Defaults belong in the schema (not in the call site) so `useLocalStorage` validation surfaces a complete `Settings` object even when localStorage is empty.
  - [ ] 2.2 Create `src/lib/schemas/provider-keys.schema.ts`:
    ```ts
    import { z } from 'zod';

    export const providerKeysSchema = z.object({
      gemini:     z.string().min(1).optional(),
      openai:     z.string().min(1).optional(),
      anthropic:  z.string().min(1).optional(),
      openrouter: z.string().min(1).optional(),
      ollama:     z.null().default(null),
    });
    export type ProviderKeys = z.infer<typeof providerKeysSchema>;

    export const activeProviderSchema = z.enum([
      'gemini', 'openai', 'anthropic', 'openrouter', 'ollama',
    ]);
    export type ActiveProvider = z.infer<typeof activeProviderSchema>;
    ```
    Notes:
    - `ollama: null` (not optional) because Ollama is a local install with no key needed; the explicit `null` documents that intent (architecture line 315).
    - Active-provider lives in the same file because it's vault-adjacent metadata; alternatively split into `active-provider.schema.ts` — but the architecture tree doesn't list a separate file, so co-locate.
    - **`min(1)` matters:** an empty string is not a valid API key. Validation must reject `""`.
  - [ ] 2.3 Create `src/lib/schemas/collection.schema.ts`. Field set is verbatim from architecture lines 691–708 (the architecture doc specifies the exact shape; do NOT deviate):
    ```ts
    import { z } from 'zod';

    export const collectionWordSchema = z.object({
      id:                z.string().uuid(),
      word:              z.string().min(1),
      ipa:               z.string().min(1),
      meaning:           z.string().min(1),
      exampleSentence:   z.string().min(1),
      savedAt:           z.string().datetime(),
      sourceParagraphId: z.string().uuid().nullable(),
      reviewCount:       z.number().int().nonnegative().default(0),
      lastReviewedAt:    z.string().datetime().nullable().default(null),
      difficultyRating:  z.number().int().min(0).max(2).default(1),
    });
    export type CollectionWord = z.infer<typeof collectionWordSchema>;
    ```
    Notes:
    - `id` is `uuid()` — NOT `++id` Dexie auto-increment. The Dexie `++id` index keyword in the stores string accepts both string and number primary keys; we deliberately use string UUIDs (generated via `crypto.randomUUID()`) so the same id can later be referenced from `recording.schema.ts paragraphId`, `paragraph-cache.schema.ts id`, etc. — cross-table references are uniformly UUIDs (architecture line 282 keyType `Table<CollectionWord, string>`). **DO NOT** use a number primary key.
    - `difficultyRating: 0|1|2` — 0 = "got it", 1 = "almost", 2 = "forgot" per FR50 BDD criteria. Default 1 matches the "Almost" middle-ground behavior on first save before any review.
  - [ ] 2.4 Create `src/lib/schemas/recording.schema.ts`. The Blob is stored alongside (not inside JSON) — Dexie supports Blob columns natively in IndexedDB. Use `z.instanceof(Blob)` to validate it. **Caveat:** `z.instanceof(Blob)` only works in browser/Node 18+; if Node-side validation ever runs (e.g., scripts/) it would fail. For MVP this is browser-only data so safe.
    ```ts
    import { z } from 'zod';

    export const recordingSchema = z.object({
      id:            z.string().uuid(),
      recordingDate: z.string().datetime(),
      paragraphId:   z.string().uuid(),
      durationMs:    z.number().int().min(0).max(60_000),  // FR32 60s cap
      mimeType:      z.string().min(1),
      blob:          z.instanceof(Blob),
      dayOfUse:      z.number().int().positive(),
    });
    export type VoiceRecording = z.infer<typeof recordingSchema>;
    ```
    Notes:
    - `durationMs` capped at 60_000 enforces FR32 (60-second hard cap) at the schema layer in addition to the recorder lifecycle layer (Story 3.1). Belt-and-suspenders.
    - `dayOfUse` is the snapshot of `distinctDaysOfUse()` at save time per architecture data-flow line 1196.
    - Type alias is `VoiceRecording` (not `Recording`) to disambiguate from the global DOM `Recording` type that may exist on `window`.
  - [ ] 2.5 Create `src/lib/schemas/paragraph-cache.schema.ts`. Re-uses the same `hardWords` shape that the LLM response schema will define in Story 1.5 — but Story 1.4 owns the persisted-record version of the schema (architecture line 1104 + epics line 526). Define the inner shape inline to avoid a circular import with `lib/llm/schemas/paragraph.schema.ts` (which doesn't exist yet — Story 1.5 creates it):
    ```ts
    import { z } from 'zod';

    export const hardWordSchema = z.object({
      word:            z.string().min(1),
      ipa:             z.string().min(1),
      meaning:         z.string().min(1),
      exampleSentence: z.string().min(1),
    });
    export type HardWord = z.infer<typeof hardWordSchema>;

    export const cachedParagraphSchema = z.object({
      id:          z.string().uuid(),
      paragraph:   z.string().min(1),
      hardWords:   z.array(hardWordSchema).min(1).max(10),
      theme:       z.string().min(1),
      persona:     z.string().min(1),
      generatedAt: z.string().datetime(),
    });
    export type CachedParagraph = z.infer<typeof cachedParagraphSchema>;
    ```
    Notes:
    - `hardWordSchema` is defined HERE, not in `lib/llm/schemas/paragraph.schema.ts`. Story 1.5 will import it from this file (`@/lib/schemas/paragraph-cache.schema`) — that's an `lib/llm` → `lib/schemas` import which is permitted (both are inside `lib/`). Reverse direction (`lib/schemas` → `lib/llm`) would be a layering violation per architecture line 1140.
    - `theme` / `persona` are typed as `z.string()` here (not the strict enums from settings.schema) because future-proofing: the offline pack might contain themes generated under prior config, and we want round-trip read tolerance. Settings still validates user input strictly via `settingsSchema.theme`.
  - [ ] 2.6 Create `src/lib/schemas/offline-pack.schema.ts`. Same inner shape as cached paragraph, plus FR63's `lastSurfacedAt` for 30-day rolling de-dupe:
    ```ts
    import { z } from 'zod';
    import { hardWordSchema } from './paragraph-cache.schema';

    export const offlinePackEntrySchema = z.object({
      id:             z.string().uuid(),
      paragraph:      z.string().min(1),
      hardWords:      z.array(hardWordSchema).min(1).max(10),
      theme:          z.string().min(1),
      persona:        z.string().min(1),
      lastSurfacedAt: z.string().datetime().nullable().default(null),
    });
    export type OfflinePackEntry = z.infer<typeof offlinePackEntrySchema>;
    ```
    Notes:
    - `lastSurfacedAt: null` initially; set to ISO datetime when an entry is shown via `select-from-offline-pack.ts` (Story 8.3).
    - Imports `hardWordSchema` from sibling — `import './paragraph-cache.schema'` (relative). Both files in same folder (`src/lib/schemas/`), so a relative import is the most explicit.
  - [ ] 2.7 Create `src/lib/schemas/day14-state.schema.ts`:
    ```ts
    import { z } from 'zod';

    export const day14StateSchema = z.object({
      fired:  z.boolean().default(false),
      result: z.enum(['yes', 'no']).nullable().default(null),
    });
    export type Day14State = z.infer<typeof day14StateSchema>;
    ```
    Notes:
    - `fired` becomes `true` exactly once per the NFR12 exact-once rule — it never reverts to `false` after Day-14 prompt completion.
    - `result` is `null` until the user answers the Day-14 prompt (Story 7.4); then it becomes `'yes'` or `'no'` and persists indefinitely.
  - [ ] 2.8 Create `src/lib/schemas/days-of-use.schema.ts`:
    ```ts
    import { z } from 'zod';

    /** UTC ISO date string in 'YYYY-MM-DD' form. */
    export const utcDateSchema = z.string().regex(
      /^\d{4}-\d{2}-\d{2}$/,
      'must be UTC ISO date YYYY-MM-DD',
    );
    export type UtcDate = z.infer<typeof utcDateSchema>;

    export const daysOfUseSchema = z.array(utcDateSchema);
    export type DaysOfUse = z.infer<typeof daysOfUseSchema>;
    ```
    Notes:
    - `utcDateSchema` is exported because `completions.schema.ts` reuses it as the record-key validator (Task 2.9).
    - The default value at the `useLocalStorage` call site will be `[]`; we don't put `.default([])` here so the schema can be reused for non-default-aware contexts (e.g., `verifyOnLoad`).
  - [ ] 2.9 Create `src/lib/schemas/completions.schema.ts`:
    ```ts
    import { z } from 'zod';
    import { utcDateSchema } from './days-of-use.schema';

    export const dayCompletionSchema = z.object({
      hasReadIt:       z.boolean().default(false),
      hasRecording:    z.boolean().default(false),
      usedOfflinePack: z.boolean().default(false),
    });
    export type DayCompletion = z.infer<typeof dayCompletionSchema>;

    export const completionsSchema = z.record(utcDateSchema, dayCompletionSchema);
    export type Completions = z.infer<typeof completionsSchema>;
    ```
    Notes:
    - `z.record(keySchema, valueSchema)` is the Zod 3.20+ form (regex-validated keys). If the installed Zod is older and rejects this signature, fallback to `z.record(z.string(), dayCompletionSchema)` and validate keys at write-time in `lib/calendar/use-mark-read-it.ts` (Story 4.2). Verify `package.json` Zod version before choosing — Story 1.1's `pnpm add zod` resolves to Zod 3.x (latest as of MVP).
    - FR53 completion logic: `(hasReadIt || hasRecording) && (paragraph generated for that day)`. The paragraph-generated check lives outside this record (in paragraphCache); this record only tracks the *reading* signal.
  - [ ] 2.10 Re-validate every schema against AC10 — each file must export BOTH the Zod schema AND the inferred TS type. Run `rg "export const \w+Schema" src/lib/schemas/` and `rg "export type \w+ = z\.infer<" src/lib/schemas/` — both greps must return at least 9 matches (one per file; some files export multiple types — that's fine).
  - [ ] 2.11 NEVER hand-write a parallel TS type alongside `z.infer<>` for the same shape (per AR16, architecture line 916). If a file needs additional non-Zod-derived types (e.g., a UI-state type that wraps a persisted shape), put them in a separate `types.ts` not in the schema file.

- [ ] **Task 3 — Build `AudiblyticsDB` Dexie class + `verifyOnLoad` + `safeWrite` in `src/lib/storage/db.ts`** (AC: 1, 2, 3, 11, 12, 14)
  - [ ] 3.1 Create `src/lib/storage/db.ts`. This is the single owner of all Dexie access. Architecture line 1180 designates this file as the IndexedDB ↔ React boundary; every `useLiveQuery` call site imports `db` from here.
  - [ ] 3.2 Implementation skeleton:
    ```ts
    import Dexie, { type Table } from 'dexie';
    import { z } from 'zod';

    import { collectionWordSchema,    type CollectionWord    } from '@/lib/schemas/collection.schema';
    import { recordingSchema,         type VoiceRecording    } from '@/lib/schemas/recording.schema';
    import { cachedParagraphSchema,   type CachedParagraph   } from '@/lib/schemas/paragraph-cache.schema';
    import { offlinePackEntrySchema,  type OfflinePackEntry  } from '@/lib/schemas/offline-pack.schema';
    import { err, ok, type Result } from '@/lib/result';

    /**
     * Discriminated-union storage error type. Returned by `safeWrite` when a Dexie
     * write fails. Renders via `<InlineErrorSurface variant="storage" />` per AR25.
     */
    export type StorageError =
      | { kind: 'quota_exceeded'; message: string }
      | { kind: 'access_denied';  message: string }
      | { kind: 'unknown';        message: string };

    export class AudiblyticsDB extends Dexie {
      collection!:     Table<CollectionWord,    string>;
      recordings!:     Table<VoiceRecording,    string>;
      paragraphCache!: Table<CachedParagraph,   string>;
      offlinePack!:    Table<OfflinePackEntry,  string>;

      constructor() {
        super('audiblytics');
        this.version(1).stores({
          collection:     '++id, savedAt, lastReviewedAt, word',
          recordings:     '++id, recordingDate, paragraphId, dayOfUse',
          paragraphCache: '++id, generatedAt, theme, persona',
          offlinePack:    '++id, theme, persona, lastSurfacedAt',
        });
      }
    }

    /** Singleton Dexie instance. Import from anywhere — there is exactly one DB connection per tab. */
    export const db = new AudiblyticsDB();

    /**
     * Wraps a Dexie write in try/catch and returns Result<T, StorageError>.
     * Logs the underlying error via console.error before returning err (AC12 — never silent).
     */
    export async function safeWrite<T>(fn: () => Promise<T>): Promise<Result<T, StorageError>> {
      try {
        return ok(await fn());
      } catch (e) {
        const error = normalizeStorageError(e);
        console.error('[storage] write failed:', error.kind, error.message, e);
        return err(error);
      }
    }

    function normalizeStorageError(e: unknown): StorageError {
      if (e instanceof DOMException) {
        if (e.name === 'QuotaExceededError') return { kind: 'quota_exceeded', message: e.message };
        if (e.name === 'NotAllowedError' || e.name === 'SecurityError') {
          return { kind: 'access_denied', message: e.message };
        }
      }
      const message = e instanceof Error ? e.message : String(e);
      return { kind: 'unknown', message };
    }

    /**
     * Validates a sample of persisted records against their Zod schemas at app load.
     * Logs (does not throw) any validation failures so a single corrupted row does
     * not brick app boot. Per AR17 (epics line 178) + architecture line 811.
     */
    export async function verifyOnLoad(): Promise<void> {
      const checks: Array<readonly [name: string, table: Table<unknown, string>, schema: z.ZodTypeAny]> = [
        ['collection',     db.collection     as unknown as Table<unknown, string>, collectionWordSchema   ],
        ['recordings',     db.recordings     as unknown as Table<unknown, string>, recordingSchema        ],
        ['paragraphCache', db.paragraphCache as unknown as Table<unknown, string>, cachedParagraphSchema  ],
        ['offlinePack',    db.offlinePack    as unknown as Table<unknown, string>, offlinePackEntrySchema ],
      ] as const;

      for (const [name, table, schema] of checks) {
        try {
          const records = await table.toArray();
          for (const record of records) {
            const result = schema.safeParse(record);
            if (!result.success) {
              console.warn(
                `[storage] verifyOnLoad: drift in '${name}' table for record`,
                (record as { id?: unknown })?.id,
                result.error.issues,
              );
            }
          }
        } catch (e) {
          console.warn(`[storage] verifyOnLoad: '${name}' table read failed`, e);
        }
      }
    }
    ```
    Notes:
    - `Table<T, string>` typing — see AC14. The `++id` Dexie store-string syntax means "auto-increment if not provided", but our schemas demand `id: z.string().uuid()`. We provide UUIDs ourselves at insert time; Dexie won't auto-generate. **Belt-and-suspenders write rule for future stories**: `await db.collection.add({ id: crypto.randomUUID(), ... })` — never rely on `++id` to fill `id`. The store-string declaration is there because Dexie's Table constructor requires *some* primary-key declaration; `++id` is the most permissive (accepts both auto-and-supplied keys).
    - `verifyOnLoad` reads ALL records, not a sample. With <100 collection words and ≤100 recordings (post-prune), this is <50ms wall-time even on slow hardware. No need for batch sampling at MVP scale.
    - The `as unknown as Table<unknown, string>` cast in the `checks` array is a TS workaround for a tuple of heterogeneous Dexie tables. The runtime values are unchanged. Acceptable per architecture line 873 (deviations require explicit acknowledgment) — this is a pure type-system workaround with no runtime effect.
  - [ ] 3.3 NEVER call `verifyOnLoad()` at module top of `db.ts`. It is exported for the dev agent to wire from `useEffect(() => { verifyOnLoad(); }, [])` inside a top-level client component (likely `<TopNav>` or a root provider added in Story 1.10 onboarding-shell). For Story 1.4, just exporting it is enough; AC3 only requires existence + correct behavior.
  - [ ] 3.4 NEVER use `db.transaction(...)` inside `safeWrite`'s argument by mistake — `transaction` re-throws abort errors as `Dexie.AbortError` which doesn't match the `DOMException` branch. If a transaction is needed, the caller wraps the entire `db.transaction(...)` call inside `safeWrite(() => db.transaction(...))` — the cast still catches.
  - [ ] 3.5 **Do NOT** import `dexie-react-hooks` here. That belongs in components/features that read live queries. This file is the Dexie source-of-truth, used by all readers.
  - [ ] 3.6 Run `pnpm tsc --noEmit` after this task to confirm `Table<T, string>` types compile (AC14 prerequisite). If `CollectionWord.id` is typed `string` and the store-string says `++id`, Dexie's `Table<CollectionWord, string>` accepts it. If TS complains, the most likely cause is `id: z.string().uuid()` not yielding `string` — verify with `type Test = CollectionWord['id']` should resolve to `string`.

- [ ] **Task 4 — Build `useLocalStorage<T>` hook** (AC: 4, 5, 6, 7, 8, 15)
  - [ ] 4.1 Create `src/lib/storage/use-local-storage.ts`. This file is the SINGLE allowed accessor of `window.localStorage` in the entire codebase (per AR12, architecture line 625). Do NOT import this hook from anywhere except via `@/lib/storage/use-local-storage`.
  - [ ] 4.2 Implementation:
    ```ts
    'use client';

    import { useCallback, useEffect, useState } from 'react';
    import type { z } from 'zod';

    /**
     * Reactive, Zod-validated, cross-tab-synced localStorage hook.
     * Single allowed accessor of `window.localStorage` per AR12 (epics line 173).
     *
     * @param key            Must be prefixed `audiblytics.` (per AR11). Throws otherwise.
     * @param defaultValue   Returned when the key is empty OR the stored value fails Zod validation.
     * @param schema         Zod schema used to validate reads. Validation failures log via console.warn.
     */
    export function useLocalStorage<T>(
      key: string,
      defaultValue: T,
      schema: z.ZodType<T>,
    ): readonly [T, (value: T | ((prev: T) => T)) => void] {
      if (!key.startsWith('audiblytics.')) {
        throw new Error(
          `useLocalStorage: key '${key}' must be prefixed 'audiblytics.' — see architecture.md § Naming Patterns lines 612–625`,
        );
      }

      const [value, setValue] = useState<T>(defaultValue);

      // Read on mount (SSR-safe — defaultValue used during initial server render).
      useEffect(() => {
        const stored = readKey(key, defaultValue, schema);
        setValue(stored);
        const handler = (e: StorageEvent) => {
          if (e.key !== key) return;
          setValue(readKey(key, defaultValue, schema));
        };
        window.addEventListener('storage', handler);
        return () => window.removeEventListener('storage', handler);
        // defaultValue + schema are stable references in real usage; eslint-disable next line if needed.
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [key]);

      const setter = useCallback(
        (next: T | ((prev: T) => T)) => {
          setValue((prev) => {
            const resolved =
              typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
            try {
              window.localStorage.setItem(key, JSON.stringify(resolved));
            } catch (e) {
              console.error(`[storage] localStorage write failed for '${key}':`, e);
            }
            return resolved;
          });
        },
        [key],
      );

      return [value, setter] as const;
    }

    function readKey<T>(key: string, defaultValue: T, schema: z.ZodType<T>): T {
      try {
        const raw = window.localStorage.getItem(key);
        if (raw === null) return defaultValue;
        const parsed = JSON.parse(raw);
        const result = schema.safeParse(parsed);
        if (result.success) return result.data;
        console.warn(`[storage] validation failed for '${key}':`, result.error.issues);
        return defaultValue;
      } catch (e) {
        console.warn(`[storage] read failed for '${key}':`, e);
        return defaultValue;
      }
    }
    ```
    Notes:
    - `'use client'` directive is required — this hook calls `useState`/`useEffect` and touches `window`, so it must be a client module (per architecture line 426).
    - `useState<T>(defaultValue)` initializes synchronously with `defaultValue`; the actual stored value is fetched in a `useEffect` after mount. This is the SSR-safe pattern (per architecture line 1120 `use-mounted.ts` comment): server render returns default → client hydrates → effect populates from localStorage.
    - The `storage` event fires only across tabs (per AC6 + architecture line 749). For same-tab updates, the setter directly calls `setValue` so the originating component's state updates immediately.
    - `JSON.stringify`/`JSON.parse` is the persistence format. Zod's parsed output is the type contract; the JSON wire-format is irrelevant past parse time.
    - The `as const` on the return preserves the tuple typing — `[T, Setter]` rather than `(T | Setter)[]`.
  - [ ] 4.3 Programmer-error assertion (AC7): the bare-key check happens at hook-call time (synchronously, on every render), NOT at module load. Why every render: if a future story dynamically computes a key (`useLocalStorage(\`audiblytics.${kind}\`, ...)`) and the kind variable is mistakenly empty, the assertion fires the same render that the bug appeared — easier to track. Performance cost: one `String.prototype.startsWith` per render — negligible.
  - [ ] 4.4 In-tab self-listen edge case: the `storage` event does NOT fire in the originating tab (MDN / spec). The setter calls `setValue` directly so the originating component re-renders. If a sibling component in the *same* tab also uses `useLocalStorage('audiblytics.activeProvider', ...)`, the setter invocation in component A will NOT trigger a re-read in component B in the same tab. **MVP-acceptable trade-off:** in practice, components consume settings/active-provider read-mostly; cross-component writes to the same key from the same tab are vanishingly rare in this app's data flow. If this becomes a problem (Story 1.9 Settings provider switch needs to flip the active provider in TopNav and ProviderChip simultaneously), introduce a tiny cross-listener via `BroadcastChannel('audiblytics-storage')` — but only if a real cross-component write occurs. Document this defer in dev-notes.
  - [ ] 4.5 Validate `key.startsWith('audiblytics.')` ONLY accepts the namespaced prefix (NOT `audiblytics` without the dot, NOT `audiblytics-` with a dash). The dot is the separator that matches the architecture line 612–625 namespace convention; bare `audiblytics` would conflict if a future story names something `audiblyticsSidebar`.
  - [ ] 4.6 Confirm zero call sites outside `src/lib/storage/use-local-storage.ts` touch `window.localStorage`. Run `rg -n "window\.localStorage\.(getItem|setItem|removeItem|clear)" src/ --glob '!src/lib/storage/use-local-storage.ts'` — must return zero matches. If a match appears (in any future file), it's a layered-boundary violation and must be refactored to use this hook (AC8).

- [ ] **Task 5 — Wire `src/lib/storage/types.ts` re-exports** (AC: 9, 15)
  - [ ] 5.1 Create `src/lib/storage/types.ts`. Architecture line 1098 designates this file as a thin re-export layer for Zod-inferred record types so consumers don't have to remember which schema file owns which type:
    ```ts
    export type {
      CollectionWord, // collection.schema
    } from '@/lib/schemas/collection.schema';

    export type {
      VoiceRecording, // recording.schema
    } from '@/lib/schemas/recording.schema';

    export type {
      CachedParagraph, // paragraph-cache.schema
      HardWord,
    } from '@/lib/schemas/paragraph-cache.schema';

    export type {
      OfflinePackEntry, // offline-pack.schema
    } from '@/lib/schemas/offline-pack.schema';

    export type {
      Settings, Theme, Persona, RetentionPolicy, // settings.schema
    } from '@/lib/schemas/settings.schema';

    export type {
      ProviderKeys, ActiveProvider, // provider-keys.schema
    } from '@/lib/schemas/provider-keys.schema';

    export type {
      Day14State, // day14-state.schema
    } from '@/lib/schemas/day14-state.schema';

    export type {
      DaysOfUse, UtcDate, // days-of-use.schema
    } from '@/lib/schemas/days-of-use.schema';

    export type {
      Completions, DayCompletion, // completions.schema
    } from '@/lib/schemas/completions.schema';

    export type {
      StorageError,
    } from './db';
    ```
    Notes:
    - Use `export type` (not `export`) so this is a TypeScript-only re-export with no runtime cost (the types vanish after compilation).
    - Each line carries an inline comment naming its origin schema for grep navigability.
    - This file is OPTIONAL for callers — they can equally import directly from `@/lib/schemas/<entity>.schema`. The types.ts re-export exists as a discoverable index, not as a forced indirection.

- [ ] **Task 6 — Production build + type-check + grep audits** (AC: 8, 14, 15)
  - [ ] 6.1 Run `pnpm tsc --noEmit`. Expect zero errors. Most likely failure mode: `Table<CollectionWord, string>` complaining that `CollectionWord.id` is not assignable to `string` — fix by ensuring `z.string().uuid()` resolves to `string` (it does; Zod's `.uuid()` is just a runtime constraint, not a brand). If a brand-typing issue arises, drop `.uuid()` and validate id format in a separate runtime check.
  - [ ] 6.2 Run `pnpm build`. Expect exit code 0 and zero new warnings (vs Story 1.3 build output). Bundle-size delta should be ~30–50KB (Dexie 4.4 is ~50KB gzipped; tree-shaking reduces actual delta if not all tables are used yet — at this story, `safeWrite`/`verifyOnLoad` are exported but not yet called from any route).
  - [ ] 6.3 Grep audit AC8 — bare localStorage outside the hook:
    ```sh
    rg -n "window\.localStorage\.(getItem|setItem|removeItem|clear)" src/ \
       --glob '!src/lib/storage/use-local-storage.ts'
    ```
    Must return zero matches. If a match appears, refactor through the hook.
  - [ ] 6.4 Grep audit AC15 — layered-import compliance:
    ```sh
    rg -n "from '@/(components|features|app)/" src/lib/
    ```
    Must return zero matches. `lib/` MUST NOT import from outside `lib/` (architecture line 1140).
  - [ ] 6.5 Grep audit — schema double-export verification (AC10):
    ```sh
    rg -n "export const \w+Schema" src/lib/schemas/ | wc -l   # ≥ 9
    rg -n "export type \w+ = z\.infer<" src/lib/schemas/ | wc -l   # ≥ 9
    ```
    Each grep must return at least 9 lines (one per file; some files export multiple schemas/types — that's fine).
  - [ ] 6.6 Grep audit — banned hand-written parallel TS types (AR16):
    ```sh
    rg -n "^export type \w+ = \{" src/lib/schemas/
    ```
    Must return zero matches. Every type in `src/lib/schemas/` must come from `z.infer<>`. (If a schema file genuinely needs a non-Zod type — e.g., a UI-state union — it goes in a separate `types.ts`, not in `*.schema.ts`.)
  - [ ] 6.7 Verify `import { db } from '@/lib/storage/db'` round-trips correctly: a quick smoke test in the browser console (or via `_dev/components/page.tsx` Story 1.3 surface) — `await db.open(); console.log(db.tables.map(t => t.name));` must print `['collection', 'recordings', 'paragraphCache', 'offlinePack']`.

- [ ] **Task 7 — Smoke-test the hook in the dev gallery (optional but recommended)** (AC: 4, 5, 6, 7)
  - [ ] 7.1 OPTIONAL: extend `src/app/_dev/components/page.tsx` (created in Story 1.3) with a small `<UseLocalStorageDemo />` section that:
    - Calls `useLocalStorage('audiblytics.demo', { count: 0 }, demoSchema)` where `demoSchema = z.object({ count: z.number() })`.
    - Renders the count + an increment button.
    - Open two tabs at `/_dev/components` and increment in tab A — confirm tab B reflects the new count after the next render (cross-tab sync via `storage` event, AC6).
  - [ ] 7.2 NEVER ship this demo in main routes. It's a dev-gallery-only verification. The `_dev` route is env-gated per Story 1.3 AC9 — verification artifacts here are unreachable in production.
  - [ ] 7.3 If the demo is added, ALSO test the bare-key assertion: a separate demo that calls `useLocalStorage('demo-no-prefix', ...)` should throw at first render — wrap in an error boundary or expect the page-level `error.tsx` to catch it. This is a programmer-error assertion (AC7) and proper failure is a passing test.
  - [ ] 7.4 If the demo is NOT added, AC4–AC7 are still verified by `pnpm tsc --noEmit` (signature) + grep (key-prefix assertion exists in source) + manual code review. The smoke test is recommended but not blocking.

- [ ] **Task 8 — Final consistency pass + dev-notes append**
  - [ ] 8.1 Confirm folder structure matches architecture lines 1095–1108:
    ```
    src/lib/
      result/
        index.ts                  ← Task 1
      schemas/
        settings.schema.ts        ← Task 2.1
        provider-keys.schema.ts   ← Task 2.2
        collection.schema.ts      ← Task 2.3
        recording.schema.ts       ← Task 2.4
        paragraph-cache.schema.ts ← Task 2.5
        offline-pack.schema.ts    ← Task 2.6
        day14-state.schema.ts     ← Task 2.7
        days-of-use.schema.ts     ← Task 2.8
        completions.schema.ts     ← Task 2.9
      storage/
        db.ts                     ← Task 3
        use-local-storage.ts      ← Task 4
        types.ts                  ← Task 5
    ```
    All 9 schema files + 3 storage files + 1 result file = 13 NEW files this story.
  - [ ] 8.2 Verify NO files outside `src/lib/result/`, `src/lib/schemas/`, `src/lib/storage/` are touched by this story. `src/app/`, `src/components/`, `src/features/` are completely untouched.
  - [ ] 8.3 Verify NO `package.json` changes — Story 1.1 already installed `dexie@^4.4`, `dexie-react-hooks@^4.2`, `zod`. This story consumes them; it does not add new deps.
  - [ ] 8.4 Append a checklist into Dev Agent Record § Completion Notes confirming AC1–AC15 individually with one-line evidence each (file path + line, type-check output, grep-audit output, etc.).
  - [ ] 8.5 If any AC is observed to fail at review, do not silently ship. Stop, document the deviation in Dev Agent Record, and either fix or escalate per architecture line 873.

## Dev Notes

### Critical pre-read (read before writing any code)

> **Mandatory:** `architecture.md` lines 260–301 (§ Storage Layers + Dexie schema), 302–336 (§ Authentication & Security — provider-key vault layout), 580–610 (§ Naming Patterns), 611–636 (§ localStorage key naming + Dexie column naming), 686–740 (§ Format Patterns — persisted record shapes + date format + error format), 1095–1108 (§ Complete Project Tree — exact file placements for `src/lib/storage/`, `src/lib/schemas/`, `src/lib/result/`), 1126–1162 (§ Architectural Boundaries — layered import direction + data boundaries). Also `epics.md` lines 502–533 (Story 1.4 verbatim) + 167–186 (AR9, AR10, AR11, AR12, AR13, AR16, AR17, AR18, AR25). The whole story is data-layer infrastructure; the architecture is non-negotiable on field shapes.

### What this story owns vs. defers

This story creates the **persistence substrate**. Every other Epic 1 story consumes it; no later story should re-define record shapes.

| Concern | This story | Future story |
|---|---|---|
| `Result<T, E>` type + `ok` / `err` / `map` / `mapErr` / `isOk` / `isErr` helpers | Task 1 | Consumed by Story 1.5 (LLM `Result<ParagraphResult, LlmError>`), Story 3.1 (recorder `Result<Recording, RecorderError>`), Story 8.1 (offline-pack writer) |
| `AudiblyticsDB` Dexie class with all 4 tables + indexes | Task 3.2 | Story 4.1 starts consuming `db.paragraphCache`; Story 2.1 starts consuming `db.collection`; Story 3.3 starts consuming `db.recordings`; Story 8.2 starts consuming `db.offlinePack` |
| Singleton `db` instance | Task 3.2 | Every `useLiveQuery` and `safeWrite` call site imports it from `@/lib/storage/db` |
| `verifyOnLoad()` exported | Task 3.2 | Story 1.10 (Today route) wires the call into a top-level `useEffect` once a top-level client component exists in the layout. For 1.4, **just exporting** is sufficient; AC3 only requires existence + correct behavior |
| `safeWrite()` Dexie write wrapper | Task 3.2 | Used by every story that writes to Dexie — 2.1 save-word, 3.3 save-recording, 4.1 cache-paragraph, 8.2 load-pack |
| 9 Zod schemas + inferred types | Task 2 | All consumed; no future story redefines a schema (modifications go IN this file's schema, not in a parallel file) |
| `useLocalStorage<T>` hook | Task 4 | Story 1.8 (onboarding) is FIRST consumer (writes `audiblytics.providerKeys`, `audiblytics.activeProvider`, `audiblytics.settings`); Story 1.9 (settings) reads the same; Story 7.4 (day14) reads/writes `audiblytics.day14State`; Story 4.2 reads/writes `audiblytics.completions`; Story 4.3 reads `audiblytics.daysOfUse` |
| `dexie-react-hooks` `useLiveQuery` setup | ❌ deferred | Each consumer story imports `useLiveQuery` directly — no wrapper needed (it's already React-aware). Story 2.2 is first to use it (collection list). |
| `BroadcastChannel('audiblytics-storage')` for in-tab cross-component sync | ❌ deferred | Re-evaluate if Story 1.9 settings provider-switch reveals a real cross-component sync gap (see Task 4.4 caveat) |
| Schema versioning (`.upgrade()` callbacks) | ❌ deferred | First time a persisted shape changes incompatibly, bump `version(2)` and add `.upgrade(tx => ...)`. MVP ships with `version(1)` only (architecture line 296 forward-only) |

**Why `verifyOnLoad` logs but does not throw:** A single corrupted row from a localStorage edit, a partial Dexie write, or a schema-version mismatch should NOT block app boot. The user's other data is still valid; the corrupted row gets surfaced via `console.warn` for the developer (Priyank, n=1) to investigate. The next legitimate write to that record will overwrite the bad data. Throwing would create a WSOD (white screen of death) for a single bad row — unacceptable.

### Layered import compliance (AR18 — non-negotiable)

This story touches `src/lib/result/`, `src/lib/schemas/`, `src/lib/storage/` only. The compliance posture:

| File | Layer | May import from | This story imports |
|---|---|---|---|
| `src/lib/result/index.ts` | `lib/` | third-party only | (none — pure types) |
| `src/lib/schemas/*.schema.ts` | `lib/` | third-party (`zod`), sibling `lib/schemas/*` | `zod`; `paragraph-cache.schema` and `days-of-use.schema` re-imported by `offline-pack.schema` and `completions.schema` respectively |
| `src/lib/storage/db.ts` | `lib/` | third-party (`dexie`, `zod`), `@/lib/schemas/*`, `@/lib/result` | `dexie`, `zod`, all 4 record-shape schemas, `@/lib/result` |
| `src/lib/storage/use-local-storage.ts` | `lib/` | third-party (`react`, `zod`) | `react` (`useState`/`useEffect`/`useCallback`), `zod` (type-only) |
| `src/lib/storage/types.ts` | `lib/` | sibling `@/lib/schemas/*` + `./db` | type-only re-exports |

**Verified absent imports** (must remain absent):
- `from '@/components/*'` in any `src/lib/` file — `lib/` MUST NOT import from `components/` (architecture line 1140).
- `from '@/features/*'` in any `src/lib/` file — same rule.
- `from '@/app/*'` in any `src/lib/` file — same rule.
- `from 'dexie'` outside `src/lib/storage/db.ts` — Dexie is the IndexedDB boundary owner; only `db.ts` may import it. (Note: `dexie-react-hooks` MAY be imported by features/components — that's the React-binding layer, separate concern.)

**`zod` import discipline:** Every `*.schema.ts` file imports `zod`. This is fine — `zod` is the schema runtime, not a layered layer. Consumers of schemas (`db.ts`, future hooks/features) import the schema file directly, not `zod`'s namespace.

### Server vs. client component boundaries (architecture lines 421–428)

| File | Type | Rationale |
|---|---|---|
| `src/lib/result/index.ts` | universal | Pure TS types + functions, no React, no DOM. Server-and-client safe. |
| `src/lib/schemas/*.schema.ts` | universal | Pure Zod schemas, no React, no DOM. Server-and-client safe. (`recording.schema.ts` uses `z.instanceof(Blob)` which fails in older Node — see Task 2.4 — but in browser context all schemas validate cleanly.) |
| `src/lib/storage/db.ts` | **client-only de-facto** | Constructs Dexie at module load (`new AudiblyticsDB()`) which calls into `indexedDB` API. SSR import is safe-ish (Dexie defers actual DB open until first query) but no server-side code path exists in the app, so this is moot. **Do NOT** add `'use client'` to a non-component file — that directive is React-component-specific. The module-load side-effect of constructing Dexie does NOT need a directive; it's gated by being imported only from client contexts. |
| `src/lib/storage/use-local-storage.ts` | **client (`'use client'`)** | React hook calling `useState`/`useEffect`/`window`. The `'use client'` directive is REQUIRED at the top of the file (architecture line 426; same pattern as audiblytics composites in Story 1.3). |
| `src/lib/storage/types.ts` | universal | Type-only re-exports; no runtime, no React. |

**Why no server-side concerns ever:** This is a single-user client-only app per NFR14. There is no server. The `app/layout.tsx` server-component is the ONE server-side surface, and it does not (per Story 1.3) touch storage. So "server vs client" for storage is theoretical only — every consumer of `db` and `useLocalStorage` is a client component.

### TypeScript strict + Zod typing pitfalls

1. **`z.instanceof(Blob)` and Node:** `Blob` is a global in browsers and Node 18+. If any tooling runs Zod validation in older Node (e.g., legacy CI), `recording.schema.ts` will throw at load. Mitigation: skip schema validation for `recording` in `verifyOnLoad`'s server-rendered path — but since the app has no SSR data path, this never manifests. **Do NOT** wrap the `z.instanceof(Blob)` in a conditional; the schema is the contract.

2. **Zod 3 vs 4 `z.record(keySchema, valueSchema)` signature:** Zod 3.20+ supports the two-arg form (key + value schemas). Older Zod 3.x only supports the one-arg `z.record(valueSchema)`. Verify Zod version with `pnpm list zod`. If the installed version is too old, fallback to `z.record(z.string(), dayCompletionSchema)` — the keys are validated at write-time in `lib/calendar/use-mark-read-it.ts` (Story 4.2) using `utcDateSchema`. **Do NOT** downgrade or upgrade Zod just for this — Story 1.1 pinned the version, and changing it ripples through every schema.

3. **`z.infer<>` and `.default()` interaction:** `z.string().default('foo')` infers `string` (NOT `string | undefined`) — the default makes the field non-optional in the inferred type. Same pattern works for object fields: `theme: themeSchema.default('adventure')` yields `theme: Theme` in the inferred TS type, not `theme?: Theme`. This is the desired behavior — every default-bearing field is non-optional in the consumer's TS view.

4. **`Table<CollectionWord, string>` second-param mismatch:** Dexie's `Table<RecordType, KeyType>` second generic is the primary-key type. Our schemas use `id: z.string().uuid()` → primary key is `string`. The store-string `'++id, savedAt, ...'` declares `id` as the primary key WITH auto-increment. **`++id` accepts both string and number primaries** (Dexie's behavior — string keys skip the auto-increment, number keys generate). Since we always pass UUIDs, the auto-increment never fires; it's vestigial from the architecture spec. `Table<CollectionWord, string>` typings are correct.

5. **`'use client'` placement in `use-local-storage.ts`:** Must be the very first line of the file (no blank line above). React App Router enforces this — a comment above the directive is permitted, a blank line is not.

6. **`crypto.randomUUID()` availability:** Available in all evergreen browsers and Node 14.17+. Story 1.4 doesn't directly call `crypto.randomUUID()` (it just defines schemas), but Story 2.1 (save-word) and 3.3 (save-recording) will. Document this here so the schema's `id: z.string().uuid()` is structurally compatible with `crypto.randomUUID()` output (which produces RFC 4122 v4 UUIDs that Zod's `.uuid()` accepts).

### Likely dev-time pitfalls (preempt these)

1. **Dexie schema string syntax — index column order matters:** `'++id, savedAt, lastReviewedAt, word'` declares 4 indexes. The first column (`++id`) is the primary key with auto-increment; the rest are secondary indexes for `.where('savedAt')`-style queries. **Order in the indexes list does NOT correspond to performance preference** — Dexie picks the most-selective index automatically. Just ensure every column referenced in a `.where(...)` query in future stories appears here.

2. **Storage event fires only across tabs:** A common confusion. The setter directly calls `setValue` for in-tab updates (Task 4.2). If a future debugger sees "increment in tab A doesn't reflect immediately in tab A's component B" (different component, same tab, same key), the fix is NOT to listen for `storage` (it won't fire); it's to either (a) lift state to a common ancestor or (b) add a `BroadcastChannel('audiblytics-storage')` shim. Defer (b) until proven needed.

3. **`JSON.stringify` does NOT serialize `Blob`:** The `useLocalStorage` hook stringifies its values. If a future story tries to put a Blob into localStorage via this hook, it will silently fail (Blob → empty object after stringify). Blobs MUST go into Dexie (which natively supports them) — never localStorage. The schema typing prevents this: `recording.schema` lives in Dexie-table land, never in localStorage land.

4. **`z.string().datetime()` strictness:** Zod's `datetime()` requires the `Z` UTC suffix or `+00:00` offset (ISO 8601 strict). Calling `new Date().toISOString()` produces the `Z` form — compatible. Calling `new Date().toString()` produces a local-time format — NOT compatible. Always persist via `new Date().toISOString()` (NEVER `.toString()`, NEVER `.toLocaleString()`, NEVER `.toLocaleDateString()`).

5. **Dexie `.add(record)` vs `.put(record)`:** `.add` throws on key conflict; `.put` upserts. Most insert call sites in future stories should use `.add` for new records (with fresh UUIDs) and `.put` for updates (e.g., `lastReviewedAt` change after review). Document this in `db.ts` JSDoc if not already obvious from Dexie docs.

6. **`useLocalStorage` hot-reload edge case:** Changing the `defaultValue` between hot reloads doesn't re-run the read effect (Task 4.2 — `useEffect` deps array includes only `[key]`). For dev-only hot-reload, this is acceptable — restart the dev server when changing defaults during development. Do not add `defaultValue` to the deps array; it would force a re-read on every render if the caller passes an inline literal (`{count: 0}`) which is a new reference each render.

7. **`schema` deps-array exclusion:** Same reasoning as `defaultValue`. The schema instance is stable in real usage (module-level Zod schema definitions). The eslint-disable on the deps array is the canonical pattern.

8. **`window.localStorage` exception in private/incognito:** Some browsers throw `SecurityError` on `localStorage.setItem` in private mode. The hook's setter catches via the inner `try/catch` in `setValue(prev => ...)`, logs `console.error`, and the in-memory state still updates (so the UI works for the session, just doesn't persist). Document this as a known limitation; private-mode usage is out of scope for n=1 personal use anyway.

9. **Dexie open() error on first call:** Dexie defers the actual `indexedDB.open(...)` until the first query. If the IndexedDB is upgrading (e.g., a stale tab from a prior schema version is open), the open call hangs. Symptoms: queries never resolve. Mitigation: close all other Audiblytics tabs before testing schema changes. **DO NOT** add a timeout-or-fail wrapper; that masks real bugs.

10. **Zod `.passthrough()` / `.strict()` choice:** Default Zod object behavior is `.strip()` — unknown keys are silently dropped. For persisted records, `.strip()` is acceptable (corrupted/extra keys vanish on next read). DO NOT use `.strict()` (rejects unknown keys → validation fails on every legacy record). DO NOT use `.passthrough()` (carries unknown keys in the inferred type → poisons consumers). Stick with the default `.strip()`.

### Pre-existing files this story modifies (UPDATE — read before editing)

**None.** Story 1.4 creates 13 new files in `src/lib/result/`, `src/lib/schemas/`, `src/lib/storage/` — all of which were `.gitkeep` placeholders after Story 1.1 Task 6.1. No file outside those folders is modified.

**Files this story creates (NEW — 13 total):**

- `src/lib/result/index.ts`
- `src/lib/schemas/settings.schema.ts`
- `src/lib/schemas/provider-keys.schema.ts`
- `src/lib/schemas/collection.schema.ts`
- `src/lib/schemas/recording.schema.ts`
- `src/lib/schemas/paragraph-cache.schema.ts`
- `src/lib/schemas/offline-pack.schema.ts`
- `src/lib/schemas/day14-state.schema.ts`
- `src/lib/schemas/days-of-use.schema.ts`
- `src/lib/schemas/completions.schema.ts`
- `src/lib/storage/db.ts`
- `src/lib/storage/use-local-storage.ts`
- `src/lib/storage/types.ts`

**Files this story does NOT touch:**

- `src/app/layout.tsx` (Story 1.3 owns; Story 1.10 will wire `verifyOnLoad()` from a top-level client component — NOT this story)
- `src/app/page.tsx` (create-next-app default — Story 1.10 replaces wholesale)
- `src/app/_dev/components/page.tsx` (Story 1.3 owns; Task 7 here is OPTIONAL extension of that gallery, only if Priyank wants the smoke-test surface)
- `src/components/audiblytics/*` (Story 1.3 created the 4 shell components; this story adds zero components)
- `src/features/*` (capability folders are empty `.gitkeep`s; this story adds zero capability code)
- `src/lib/llm/`, `src/lib/audio/`, `src/lib/day-counter/`, `src/lib/hooks/` (other lib subfolders are owned by Stories 1.5, 1.7, 4.3, 3.6 respectively)
- `package.json` (Story 1.1 already installed all deps; Story 1.4 adds zero deps)
- `next.config.ts` (Story 1.6 owns)

### Capability-area discipline (NFR28 + AR19)

Story 1.4 lives entirely in `src/lib/` — the **cross-cutting infrastructure** layer (architecture line 648). None of the schemas or storage modules are capability-specific. The 9 schemas are *shared* across multiple capability areas:

| Schema file | Used by features |
|---|---|
| `settings.schema.ts` | `features/settings/`, `features/onboarding/`, every feature reading defaults |
| `provider-keys.schema.ts` | `features/settings/`, `features/onboarding/`, `lib/llm/client.ts` |
| `collection.schema.ts` | `features/collection/`, `features/review/` (reads collection words for flashcards) |
| `recording.schema.ts` | `features/voice-journal/`, `features/day14/` (reads day-1 recordings) |
| `paragraph-cache.schema.ts` | `features/paragraph/`, `features/calendar/` (archived day view) |
| `offline-pack.schema.ts` | `features/offline-pack/` |
| `day14-state.schema.ts` | `features/day14/`, `app/_internal/Day14Gate.tsx` |
| `days-of-use.schema.ts` | `lib/day-counter/`, `features/calendar/` |
| `completions.schema.ts` | `features/calendar/`, `features/paragraph/` (mark-read-it after generation) |

Because they're cross-cutting, they belong in `lib/`, not `features/<one-capability>/`. This matches architecture's folder-decision-tree line 651 (Zod schema for persisted record → `src/lib/schemas/<entity>.schema.ts`).

### `Result<T, E>` pattern — why centralize?

Three options were considered for where to put the Result type:

| Option | Where | Decision |
|---|---|---|
| Inline in each caller | Re-define `Result` in `lib/storage/db.ts`, `lib/llm/generate.ts`, `lib/audio/recorder.ts` | Rejected — three parallel definitions diverge over time; `isOk` / `map` helpers get re-implemented inconsistently |
| `lib/result/index.ts` (CHOSEN) | Single source of truth | Architecture line 1117–1118 explicitly designates this path. Every consumer imports `Result`, `ok`, `err` from one place. |
| `lib/types.ts` | Cross-folder grab-bag | Rejected — encourages a kitchen-sink types file; `lib/result/` is more discoverable and grep-friendly |

The `lib/result/` folder may grow over time to include `Either<L, R>` if needed (it's not — Result covers the use cases) or `Try<T>` (also not needed — Promise<Result<T, E>> is cleaner than Try). For MVP, `lib/result/index.ts` is the entire folder.

### Schema-evolution policy (post-MVP)

When a persisted record shape needs to change incompatibly (rename, type change, removal):

1. Bump Dexie `version(N)` in `db.ts` (architecture line 296).
2. Add `.upgrade(tx => { ... })` callback that migrates rows from old shape → new shape.
3. Update the corresponding `*.schema.ts` to the new shape.
4. **Do NOT** edit existing migration callbacks once shipped — append new versions only.
5. **Do NOT** add a "down migration" — Dexie/IndexedDB are forward-only by design.

For localStorage: there's no built-in versioning. If a localStorage shape changes incompatibly, the new schema's validation will fail → defaultValue returned → the next setter call writes the new shape. Acceptable for n=1 — Priyank loses one session's settings, then they're auto-reset.

For now (Story 1.4 ships v1), no migration logic is needed. Document the policy here so future stories know how to handle shape changes.

### `verifyOnLoad` scope (defer-to-app-load wiring)

Story 1.4 EXPORTS `verifyOnLoad`. It does NOT wire the call into `app/layout.tsx` or any route. Why: `app/layout.tsx` is a server component (Story 1.3), and `verifyOnLoad` calls `db.collection.toArray()` which requires browser IndexedDB — server context will throw `ReferenceError: indexedDB is not defined`.

The CORRECT wiring point — when it lands — is inside a top-level client component that mounts on every route:

```tsx
// Future Story 1.10 — Today route's outer client wrapper
'use client';
import { useEffect } from 'react';
import { verifyOnLoad } from '@/lib/storage/db';

export function AppShellClient({ children }: { children: ReactNode }) {
  useEffect(() => { verifyOnLoad(); }, []);
  return <>{children}</>;
}
```

Or alternatively, fold the call into `<TopNav>` (already client per Story 1.3) — but `<TopNav>` re-mounts on every route navigation in App Router by default, and `verifyOnLoad` should run ONCE per app load, not per route. So a higher-up client wrapper is preferred. **Decision deferred to Story 1.10** (which builds the Today route). Story 1.4 only needs the export to satisfy AC3.

### Project Structure Notes

**Alignment with `architecture.md § Complete Project Tree` lines 1095–1108:** All 13 new file paths match the tree exactly. The tree explicitly lists each schema by name + responsibility — Story 1.4 produces them 1:1.

**Detected conflicts or variances:**

- **Hook file naming convention:** Architecture line 587 example shows `useLocalStorage.ts` (camelCase), but the architecture's own `Complete Project Tree` line 1097 lists `use-local-storage.ts` (kebab-case). The same kebab convention is applied throughout the tree (`use-distinct-day-of-use.ts`, `use-paragraph-of-the-day.ts`, `use-prune-on-mount.ts`, etc.). **Resolved in favor of the tree** — `use-local-storage.ts` (kebab-case) is the file name. The line 587 example is a stale inconsistency; the tree is the authoritative placement source. The exported symbol remains `useLocalStorage` (camelCase) per line 601.
- **`StorageError` type location:** Architecture line 726 declares the type in prose without specifying a file. This story places it in `src/lib/storage/db.ts` (alongside `safeWrite` which produces it) and re-exports via `src/lib/storage/types.ts`. Acceptable per architecture line 873 — file placement for inline type definitions is implementation freedom as long as the import surface is discoverable.
- **`hardWordSchema` location:** Architecture lines 350–355 show the LLM response shape with the hardWords structure inline. The architecture tree lists `lib/llm/schemas/paragraph.schema.ts` (line 1087) AND `lib/schemas/paragraph-cache.schema.ts` (line 1104) — but the SAME `hardWords` shape needs to live in both contexts (LLM response validation + persisted cache). To avoid circular imports between `lib/llm/` and `lib/schemas/`, this story defines `hardWordSchema` in `lib/schemas/paragraph-cache.schema.ts` and Story 1.5's `lib/llm/schemas/paragraph.schema.ts` will IMPORT FROM it. **Variance acknowledged:** the shape ownership is `lib/schemas/`, not `lib/llm/schemas/`; the LLM-side schema is a wrapper that includes the prompt-output envelope. Story 1.5 will compose accordingly.
- **`activeProvider` schema location:** Architecture line 619 lists `audiblytics.activeProvider` as a separate localStorage key, and the tree at line 1099–1108 doesn't enumerate a separate `active-provider.schema.ts`. This story places `activeProviderSchema` inside `provider-keys.schema.ts` (the key vault is conceptually the broader Provider concern). Acceptable variance — the tree doesn't forbid co-location; AR16 only requires that each persisted shape has exactly one schema definition (which it does).

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` § Story 1.4 (lines 502–533)] — verbatim acceptance criteria source
- [Source: `_bmad-output/planning-artifacts/epics.md` § Additional Requirements AR9 (line 170)] — Result discriminated union
- [Source: `_bmad-output/planning-artifacts/epics.md` § Additional Requirements AR10 (line 171)] — Dexie schema (single version) + indexes
- [Source: `_bmad-output/planning-artifacts/epics.md` § Additional Requirements AR11 (line 172)] — localStorage `audiblytics.*` namespacing
- [Source: `_bmad-output/planning-artifacts/epics.md` § Additional Requirements AR12 (line 173)] — useLocalStorage hook as sole accessor
- [Source: `_bmad-output/planning-artifacts/epics.md` § Additional Requirements AR16 (line 177)] — Zod as single source of truth for shapes
- [Source: `_bmad-output/planning-artifacts/epics.md` § Additional Requirements AR17 (line 178)] — schema validation on read (verifyOnLoad)
- [Source: `_bmad-output/planning-artifacts/epics.md` § Additional Requirements AR18 (line 179)] — layered import direction
- [Source: `_bmad-output/planning-artifacts/epics.md` § Additional Requirements AR25 (line 186)] — quota error surfacing path
- [Source: `_bmad-output/planning-artifacts/architecture.md` § Storage Layers + Dexie Schema (lines 260–301)] — 4-table schema, indexes, validation policy, quota handling
- [Source: `_bmad-output/planning-artifacts/architecture.md` § Authentication & Security — API key vault (lines 306–323)] — ProviderKeys + ActiveProvider type shapes
- [Source: `_bmad-output/planning-artifacts/architecture.md` § Naming Patterns (lines 580–610)] — file naming, symbol naming, Zod schema export naming
- [Source: `_bmad-output/planning-artifacts/architecture.md` § localStorage key naming (lines 612–625)] — namespaced key list + raw-localStorage ban
- [Source: `_bmad-output/planning-artifacts/architecture.md` § Format Patterns — persisted record shapes (lines 686–740)] — Zod-as-truth, date format, error format, Result pattern
- [Source: `_bmad-output/planning-artifacts/architecture.md` § Communication Patterns (lines 743–763)] — state-management decision tree (useLiveQuery / useLocalStorage / useState)
- [Source: `_bmad-output/planning-artifacts/architecture.md` § Process Patterns — error handling (lines 766–812)] — error surfacing rules, validation timing
- [Source: `_bmad-output/planning-artifacts/architecture.md` § Complete Project Tree (lines 1095–1108)] — exact file placements for `lib/storage/`, `lib/schemas/`, `lib/result/`
- [Source: `_bmad-output/planning-artifacts/architecture.md` § Architectural Boundaries (lines 1126–1162)] — layered import direction + data boundaries
- [Source: `_bmad-output/planning-artifacts/architecture.md` § Pattern Examples — Anti-Patterns (lines 875–929)] — explicit examples of what NOT to do (bare localStorage, hand-written parallel types, throwing for app errors)
- [Source: `_bmad-output/planning-artifacts/prd.md` § Functional Requirements FR4–FR9 (lines 715–723)] — Settings field set + provider key vault preservation rule
- [Source: `_bmad-output/planning-artifacts/prd.md` § Functional Requirements FR19, FR21 (lines 736, 738)] — paragraph cache same-day reuse + retention
- [Source: `_bmad-output/planning-artifacts/prd.md` § Functional Requirements FR26, FR31, FR34, FR39 (lines 749, 757, 760, 765)] — collection / recording / day14 field shapes
- [Source: `_bmad-output/planning-artifacts/prd.md` § Functional Requirements FR53–FR55, FR62–FR63 (lines 788–801)] — completions / offline pack field shapes
- [Source: `_bmad-output/planning-artifacts/prd.md` § Non-Functional Requirements NFR8 (line 820)] — zero silent recording loss bar
- [Source: `_bmad-output/planning-artifacts/prd.md` § Non-Functional Requirements NFR12, NFR13 (lines 832–834)] — UTC day-counting + DST/timezone correctness
- [Source: `_bmad-output/planning-artifacts/prd.md` § Non-Functional Requirements NFR16, NFR17 (lines 836–838)] — no telemetry / no exfiltration (informs the console.warn-not-throw policy)
- [Source: `_bmad-output/implementation-artifacts/1-1-project-scaffold-and-agent-configuration.md`] — previous story; created `src/lib/{result,schemas,storage}/` empty placeholder folders + installed `dexie@^4.4`, `dexie-react-hooks@^4.2`, `zod`
- [Source: `_bmad-output/implementation-artifacts/1-2-visual-token-system-typography-and-self-hosted-fonts.md`] — previous story; established Tailwind v4 token discipline (informational only; no styling concerns in 1.4)
- [Source: `_bmad-output/implementation-artifacts/1-3-root-layout-shell-topnav-dayrail-skeleton-statrail-skeleton-and-honesty-footer.md`] — previous story; established server/client component boundaries + the `_dev/components` gallery surface (Task 7 optional smoke test)

## Dev Agent Record

### Context Reference

- This story spec is self-contained. The dev agent should read this file plus the four planning artifacts referenced above (epics.md, architecture.md, ux-design-specification.md, prd.md) and the three prior story files (1-1, 1-2, 1-3). UX-design-specification.md is informational only for 1.4 — there is NO UI in this story.
- Previous stories: `1-1-project-scaffold-and-agent-configuration.md` (status: ready-for-dev), `1-2-visual-token-system-typography-and-self-hosted-fonts.md` (status: ready-for-dev), `1-3-root-layout-shell-topnav-dayrail-skeleton-statrail-skeleton-and-honesty-footer.md` (status: ready-for-dev). If 1.1 has not been implemented yet, complete it first — Story 1.4 requires `dexie`, `dexie-react-hooks`, and `zod` deps installed by Story 1.1 Task 3.
- No `project-context.md` files were found in the workspace at story-creation time.
- No git history exists at story-creation time; no prior code patterns to inherit beyond what 1.1–1.3 produce.

### Previous Story Intelligence

Story 1.3 (Root Layout Shell, TopNav, DayRail, StatRail, HonestyFooter, _dev/components) established the layout substrate. From 1.3's Dev Notes § What this story owns vs. defers:

| 1.3 produced | 1.4 uses |
|---|---|
| `src/app/layout.tsx` server component with shell composition | NOT modified by 1.4 — `verifyOnLoad` wiring deferred to Story 1.10 |
| `src/app/_dev/components/page.tsx` env-gated dev gallery | OPTIONAL Task 7 extension — adds `<UseLocalStorageDemo />` for cross-tab smoke test |
| 4 audiblytics shell components (TopNav, DayRail, StatRail, HonestyFooter) | NOT consumed by 1.4 — storage layer is presentation-agnostic |
| Server/client component discipline (`'use client'` only when needed) | 1.4 applies the SAME discipline: `use-local-storage.ts` is `'use client'` (uses `useState`/`useEffect`); `db.ts`/`schemas/*` are universal modules without directives |
| Layered-import audit pattern (`rg "from '@/(features\|app)" src/components/audiblytics/`) | 1.4 applies the equivalent audit for `lib/`: `rg "from '@/(components\|features\|app)/" src/lib/` — must return zero matches (Task 6.4) |

**Patterns established by 1.3 to honor here:**

- **Named exports always.** `db`, `useLocalStorage`, every schema, every Result helper — all named exports per architecture lines 924–928. No `export default`.
- **Layered-import compliance audited via grep.** Every story applies the same grep audit pattern; Story 1.4 audits in the OPPOSITE direction (lib/ must not import outward).
- **`'use client'` only when needed.** `use-local-storage.ts` needs it (React hook + DOM). `db.ts` does NOT (no React, no JSX); the module-load Dexie construction is a side-effect that happens on first import — gated by being imported only from client contexts. **Do NOT** add `'use client'` to `db.ts` to "be safe" — it's a non-component file, the directive is meaningless, and adding it confuses tooling (some bundlers treat `'use client'` as a hint that the file exports React components).
- **Architecture references inline as `[Source: ...]`.** Every dev-note claim cites the exact architecture/epics/prd line range. Story 1.4 follows the same citation hygiene.
- **No package.json changes.** Story 1.1 installed all deps for the entire MVP. Stories 1.2–1.4 ADD ZERO new deps. If a dep seems missing, the issue is import path / re-export — not a missing install.

**Story 1.2 patterns honored here:**

- Token discipline is irrelevant to 1.4 (no UI), but the underlying principle — single source of truth — translates to schemas: every persisted shape has ONE definition (the Zod schema); types derive via `z.infer<>`. Same single-source-of-truth posture, different domain.
- Build-time correctness gate (`pnpm build` exit 0) is the same baseline. Story 1.4 adds zero new lint failures or type errors.

**Story 1.1 patterns honored here:**

- File naming: `*.schema.ts` for Zod schemas (architecture line 590), `kebab-case.ts` for lib modules (line 588), `db.ts` (singular noun for DB owner is acceptable).
- Banned-deps posture: zero new deps. `dexie@^4.4`, `dexie-react-hooks@^4.2`, `zod` are pre-installed.
- Folder shape: `src/lib/result/`, `src/lib/schemas/`, `src/lib/storage/` were created as `.gitkeep` placeholders by Story 1.1 Task 6.1. Story 1.4 populates them.
- Three-file enforcement of personal-use boundary: this story does not touch `README.md`, `AGENTS.md`/`CLAUDE.md`, or `.cursor/rules/architecture.mdc`.
- No `git init`, no commits, no remote — same as 1.1–1.3.

**Likely 1.1–1.3 review cycles to anticipate before starting 1.4:**

- If `pnpm list dexie zod` reveals versions other than `^4.4` and Zod 3.x respectively, fix Story 1.1 first.
- If `src/lib/{result,schemas,storage}/` folders don't exist (Story 1.1 Task 6.1 not yet implemented), create them with `.gitkeep` files first OR finish 1.1 first.
- If TS strict mode is not enabled (`tsconfig.json` `"strict": true`), all schema typing falls apart — verify Story 1.1's tsconfig before starting.

### Agent Model Used

Composer (Cursor coding agent)

### Debug Log References

### Completion Notes List

- **AC1**: `AudiblyticsDB` + `version(1).stores({...})` with four indexed tables — `src/lib/storage/db.ts`
- **AC2**: `export const db = new AudiblyticsDB()` — `src/lib/storage/db.ts`
- **AC3**: `verifyOnLoad()` iterates all rows, `schema.safeParse`, `console.warn` on drift / read failure — `src/lib/storage/db.ts`
- **AC4**: `useLocalStorage<T>(key, defaultValue, schema)` returns `readonly [T, setter]` — `src/lib/storage/use-local-storage.ts`
- **AC5**: `readKey` uses `JSON.parse` + `safeParse`, `console.warn` + `defaultValue` on failure; no auto-overwrite — `src/lib/storage/use-local-storage.ts`
- **AC6**: `storage` event listener in `useEffect`, cleanup on unmount — `src/lib/storage/use-local-storage.ts`
- **AC7**: Top-of-body `key.startsWith('audiblytics.')` throws with specified message — `src/lib/storage/use-local-storage.ts`
- **AC8**: Grep audit: only `src/lib/storage/use-local-storage.ts` matches `window.localStorage.(getItem|setItem|removeItem|clear)` under `src/` (pass)
- **AC9**: Exactly nine files in `src/lib/schemas/*.schema.ts` per AC9 list (pass)
- **AC10**: Every schema file exports `*Schema` + `export type X = z.infer<typeof ...>`; grep `export const \w+Schema` ≥9 and `export type \w+ = z.infer<` ≥9 (pass)
- **AC11–AC12**: `safeWrite` returns `Result<T, StorageError>`, classifies `QuotaExceededError` / `NotAllowedError` / `SecurityError`, `console.error` before `err` — `src/lib/storage/db.ts`
- **AC13**: `Result`, `ok`, `err`, `map`, `mapErr`, `isOk`, `isErr` — `src/lib/result/index.ts`
- **AC14**: `pnpm exec tsc --noEmit` exit 0; `pnpm build` exit 0
- **AC15**: Grep `from '@/(components|features|app)/` in `src/lib/` — zero matches (pass)
- **AR16-style audit**: `^export type \w+ = \{` in `src/lib/schemas/` — zero matches (pass)

### File List

- `src/lib/result/index.ts`
- `src/lib/schemas/settings.schema.ts`
- `src/lib/schemas/provider-keys.schema.ts`
- `src/lib/schemas/collection.schema.ts`
- `src/lib/schemas/recording.schema.ts`
- `src/lib/schemas/paragraph-cache.schema.ts`
- `src/lib/schemas/offline-pack.schema.ts`
- `src/lib/schemas/day14-state.schema.ts`
- `src/lib/schemas/days-of-use.schema.ts`
- `src/lib/schemas/completions.schema.ts`
- `src/lib/storage/db.ts`
- `src/lib/storage/use-local-storage.ts`
- `src/lib/storage/types.ts`
