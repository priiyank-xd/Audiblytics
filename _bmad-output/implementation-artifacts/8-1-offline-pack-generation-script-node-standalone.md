# Story 8.1: Offline-Pack Generation Script (Node, Standalone)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Priyank,
I want a standalone `pnpm tsx scripts/generate-offline-pack.ts` script that generates ~1000 paragraphs across all theme × persona combinations using Gemini 2.5 Flash-Lite throttled to ≤10 RPM,
So that I can produce the offline pack on my machine without inflating the deployed app's bundle and without burning through my free-tier quota.

## Acceptance Criteria

> Sourced from `epics.md § Story 8.1` (lines 1586–1614). Numbered for task traceability.

1. **AC1 — Env and entrypoint** — Given `.env.local` contains `OFFLINE_PACK_PROVIDER_KEY=<gemini-key>` (per **AR28** in epics, architecture `.env.example` pattern), when the developer runs `pnpm tsx scripts/generate-offline-pack.ts`, the script loads that key and runs to completion without requiring the Next.js dev server (per **AR24**, **FR60**).

2. **AC2 — Coverage and counts** — The script loops all theme × persona combinations (**6 themes × 4 personas = 24**, per **FR4** launch lists in PRD/epics). Target **~42 paragraphs per combination** for **~1000 total** (~1008); slight variance acceptable if individual generations fail validation (per PRD §J6 / epics).

3. **AC3 — Model** — The Gemini model id is the string literal **`gemini-2.5-flash-lite`**, not runtime `gemini-2.5-flash` (per **AR5** epics distinction, architecture lines 389–395, 257).

4. **AC4 — Rate limit** — Requests are throttled to **≤10 RPM** (one request every ≥6s minimum spacing, or equivalent token bucket) as a safety margin under Flash-Lite’s **15 RPM** free-tier ceiling (per **AR24**, architecture line 413).

5. **AC5 — Validation failures** — When any single LLM response fails Zod validation (`paragraphSchema.safeParse`), log the failure (theme, persona, index, Zod issues), **skip** that entry, and **continue** the batch (final pack may be ~990 entries; acceptable per PRD §J6).

6. **AC6 — Output artifact** — On success, write a **JSON file** to a path consumable by Story 8.2’s Settings “Download Pack” flow — canonical path **`public/offline-pack.json`** at repo root (per epics example, architecture lines 200–213, 1241–1242).

7. **AC7 — Schema parity** — Each **LLM body** (`paragraph` + `hardWords`) MUST validate against the same Zod **`paragraphSchema`** exported from `src/lib/llm/schemas/paragraph.schema.ts` (Story 1.5) — import that module directly so the script cannot drift from runtime generation (epics: “imports from … paragraph.schema.ts directly”; architecture **pack-schema-equivalence** / line 92).

8. **AC8 — Pack row shape for downstream** — The JSON file MUST be a **top-level array** of objects that Story 8.2 can insert into Dexie `offlinePack`: at minimum each object includes **`theme`**, **`persona`**, **`generatedAt`** (UTC ISO datetime string per architecture NFR13), plus the validated **`paragraph`** and **`hardWords`** fields. **`lastSurfacedAt`** is omitted or `null` on generation — Story 8.2 / Dexie assign on load if needed. Lock field names to **`src/lib/schemas/offline-pack.schema.ts`** once inspected; if that file is still a placeholder from Story 1.4, define the export shape here to match **AR10** indexes (`theme`, `persona`, `lastSurfacedAt`) and Story 8.2 expectations.

9. **AC9 — Progress / ETA** — Script logs progress and an **approximate ETA** (~70 minutes wall time at 10 RPM for ~1000 calls — epics).

10. **AC10 — Boundary** — Script file lives at **`scripts/generate-offline-pack.ts`** (NOT under `src/`), NOT bundled with the deployed app (architecture lines 656, 211, **AR24**).

11. **AC11 — Prompt reuse** — Use **`buildPrompt({ theme, persona, length, recycleWords })`** from `src/lib/llm/prompts/paragraph.ts` with **`recycleWords: []`** (cold-start) and a fixed **`length`** consistent with app defaults (e.g. **150** words — FR5 range 100–200). Do not fork an alternate prompt builder in `scripts/`.

12. **AC12 — No `MODEL_BY_PROVIDER` in script** — The batch model id is a **literal** in the script only — do **not** add offline-pack entries to `src/lib/llm/models.ts` (explicit anti-pattern in Story 1.5 dev notes).

## Tasks / Subtasks

- [x] **Task 1 — Script scaffold + env** (AC: 1, 10)
  - [x] 1.1 Add `scripts/generate-offline-pack.ts`. Loads `.env.local` from repo root (manual parse) and reads **`OFFLINE_PACK_PROVIDER_KEY`**. Fails fast if missing (non-`--dry`).
  - [x] 1.2 Script header documents `pnpm tsx scripts/generate-offline-pack.ts` and keeps all non-`src/features`/non-`src/app` imports.

- [x] **Task 2 — Gemini client + model literal** (AC: 3, 12)
  - [x] 2.1 Uses `createGoogleGenerativeAI` (aliased as `google`) with the literal model id **`gemini-2.5-flash-lite`**; all `@ai-sdk/google` usage stays inside `scripts/`.

- [x] **Task 3 — Generation loop** (AC: 2, 4, 5, 11)
  - [x] 3.1 Defines theme/persona arrays matching `settings.schema.ts` encodings.
  - [x] 3.2 Nested loops generate 42 paragraphs per combo (target ~1008); adds a variant label to reduce duplication.
  - [x] 3.3 Calls `generateText` with `Output.object({ schema: paragraphSchema })`, then defensive `paragraphSchema.safeParse`; SDK/parse failures are logged and skipped.
  - [x] 3.4 Throttles to ≤10 RPM via ≥6s spacing between submit starts.

- [x] **Task 4 — Validate, assemble, write JSON** (AC: 6, 7, 8)
  - [x] 4.1 Validates `paragraphSchema.safeParse` and skips invalid responses.
  - [x] 4.2 Writes JSON to `public/offline-pack.json` (creates `public/` if needed). Output is a top-level array.

- [x] **Task 5 — Logging** (AC: 9)
  - [x] 5.1 Logs combo + index, attempts/completed counts, elapsed time, and a rolling ETA.

- [x] **Task 6 — Repo hygiene** (AC: 10)
  - [x] 6.1 Adds `public/offline-pack.json` to `.gitignore`.

- [x] **Task 7 — Verification** (AC: all)
  - [x] 7.1 Supports `--dry --limit=<N>` (CI/manual smoke mode).
  - [x] 7.2 Header documents the ~70 minute full-run expectation.

## Dev Notes

### Architecture compliance

- **Script location:** `scripts/<task>.ts` only — not `src/` (architecture folder decision tree, line 656).
- **Schema:** Single source of truth for LLM JSON shape — `paragraphSchema` at `src/lib/llm/schemas/paragraph.schema.ts` (architecture lines 348–356, 651–652).
- **Models:** Runtime default `gemini-2.5-flash`; **this script only** uses `gemini-2.5-flash-lite` (architecture lines 257, 393–395).
- **Rate:** Offline-pack throttling ≤10 RPM (architecture line 413).
- **Env:** `OFFLINE_PACK_PROVIDER_KEY` documented in `.env.example` (AR28 / architecture line 972).
- **No backend:** Script runs on developer machine; output is static JSON for Story 8.2 (architecture lines 1241–1242).

### Technical requirements

- **Node:** Use Node **≥18.17** (Next.js 16 minimum — architecture line 155); global `fetch` available).
- **Imports:** Script may import `@/lib/llm/schemas/paragraph.schema`, `@/lib/llm/prompts/paragraph`, `ai`, `zod`, `@ai-sdk/google`. Resolve `@/` via `tsconfig` paths when running under `tsx` (verify `pnpm tsx` resolves paths; if not, use relative imports to `src/lib/...` from `scripts/` — **match repo tsconfig**).
- **Security:** Never print API key in logs. Redact errors (same discipline as Story 1.5).
- **Result type:** Script can use simple logging + `process.exit` codes; full `Result<T,E>` optional for internal helpers.

### Dependency on Story 1.5

- **`paragraphSchema`**, **`buildPrompt`**, and **`generateText` + `Output.object`** must exist (Story 1.5). If Story 1.5 is not merged yet, coordinate branch order — **do not duplicate** schema definitions in `scripts/`.

### Previous story intelligence

- Story **8.1** is the **first** story in Epic 8 — no prior Epic 8 story file. Cross-epic dependency: **Story 1.5** (`paragraphSchema`, prompts, AI SDK 6 pattern).

### Project structure notes

- Output: `public/offline-pack.json` aligns with Story 8.2 fetching from `public/` (epics Story 8.2).
- Do **not** add webpack/next config to bundle the script — it runs standalone.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 8, Story 8.1]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — § API & Communication Patterns, § Offline-pack script, § Folder decision tree, model defaults table]
- [Source: `_bmad-output/planning-artifacts/epics.md` — AR24, AR28, AR5]
- [Source: `_bmad-output/implementation-artifacts/1-5-llm-provider-abstraction-schema-validation-retry-and-error-parsing.md` — schema path, anti-pattern MODEL_BY_PROVIDER]

## Dev Agent Record

### Agent Model Used
claude-4.6-sonnet-medium-thinking (auto-sprint)

### Debug Log References

### Completion Notes List

Standalone script created at `scripts/generate-offline-pack.ts`:
- Reads `OFFLINE_PACK_PROVIDER_KEY` from `.env.local` (manual parse).
- Uses Gemini literal `gemini-2.5-flash-lite`.
- Generates ~42 paragraphs per theme×persona combo, validates against `paragraphSchema`, skips invalids, and throttles to ≤10 RPM (≥6s spacing between calls).
- Writes `public/offline-pack.json` as a top-level JSON array (includes `generatedAt` while keeping row shape validated via `offlinePackEntrySchema`).
- Adds `public/offline-pack.json` to `.gitignore`.

### File List
 - `scripts/generate-offline-pack.ts`
 - `.gitignore` (added `public/offline-pack.json`)
---
**Story completion status:** Standalone offline-pack generation script implemented per Story 8.1.
