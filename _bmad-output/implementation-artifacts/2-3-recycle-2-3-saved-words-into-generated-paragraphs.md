# Story 2.3: Recycle 2–3 Saved Words Into Generated Paragraphs

Status: done

## Story

As Priyank,
I want every paragraph generation to weave 2–3 randomly selected words from my saved collection back in (when ≥2 saved words exist),
so that recently learned vocabulary recurs in fresh contexts and the loop becomes self-feeding.

## Acceptance Criteria

1. **Given** the user's collection has ≥2 saved words  
   **When** the user clicks Generate on the Today screen  
   **Then** `select-recycle-words.ts` (in `features/paragraph/`) returns 2–3 words selected from the collection (per FR15)  
   **And** the prompt builder injects these words into the LLM prompt with explicit instructions to use them in the generated paragraph  
   **And** the LLM response paragraph contains those words verbatim or in close morphological variants  
   [Source: `_bmad-output/planning-artifacts/epics.md` “Story 2.3”; `_bmad-output/planning-artifacts/prd.md` FR15; `_bmad-output/planning-artifacts/architecture.md` “Provider abstraction / prompt builder”]

2. **Given** the user's collection has 0 or 1 words (cold-start)  
   **When** the user clicks Generate  
   **Then** the prompt builder omits the recycle section and requests only new advanced words (per FR16)  
   **And** no error surfaces and generation succeeds normally  
   [Source: `_bmad-output/planning-artifacts/epics.md` “Story 2.3”; `_bmad-output/planning-artifacts/prd.md` FR16]

3. **Given** the LLM has just generated a paragraph  
   **When** the response is validated and accepted  
   **Then** the full `{ paragraph, hardWords[], theme, persona, generatedAt: UTC datetime }` is written to the Dexie `paragraphCache` table (per FR21)  
   **And** the entry is keyed by `id` and indexed by `generatedAt`  
   [Source: `_bmad-output/planning-artifacts/epics.md` “Story 2.3”; `_bmad-output/planning-artifacts/prd.md` FR21; `_bmad-output/planning-artifacts/architecture.md` “Dexie schema”, “Date/time format (NFR13)”]

4. **Given** a recycled word appears in the rendered paragraph  
   **When** the hard-words list renders below  
   **Then** the recycled word may appear in the hard-words list with a recycled-variant marker (`♺` per UX-DR12)  
   **And** the per-PRD Q2 default of "no visual indicator on recycled words within the paragraph itself" is preserved (the `<mark>` highlight applies to all hard words equally)  
   [Source: `_bmad-output/planning-artifacts/epics.md` “Story 2.3”; `_bmad-output/planning-artifacts/ux-design-specification.md` `HardWordRow` + Q2 default]

## Tasks / Subtasks

- [x] Implement recycle-word selector (AC: 1, 2)
  - [x] Add `src/features/paragraph/select-recycle-words.ts` that returns `CollectionWord[]` length \(0\) (cold-start), \(2\), or \(3\)
  - [x] Selection is random across saved words (no recency bias required); ensure it never returns duplicates
  - [x] Keep the selector pure(ish): it can query Dexie or accept candidate words; follow the existing patterns in `features/paragraph/`

- [x] Inject recycled words into prompt builder (AC: 1, 2)
  - [x] Update `src/lib/llm/prompts/paragraph.ts` to accept an optional `recycleWords` array and to omit the section when empty
  - [x] Ensure prompt text instructs the model to naturally include the recycled words (verbatim preferred; close morphological variants acceptable) without listing them as a glossary

- [x] Wire recycleWords into generation flow (AC: 1, 2)
  - [x] Update paragraph generation call-site (likely `src/features/paragraph/use-generate-paragraph.ts` or `src/lib/llm/generate.ts`) to:
    - [x] Query 2–3 words from collection (when available)
    - [x] Pass them through to the prompt builder
  - [x] Preserve provider abstraction seam: no provider-specific branching at call sites

- [x] Persist accepted paragraph to paragraph cache (AC: 3)
  - [x] Confirm `paragraphCache` table exists per `architecture.md` (Dexie schema) with `generatedAt` index
  - [x] Ensure `generatedAt` is persisted as a UTC ISO datetime string
  - [x] Persist enough metadata to support later Epic 4 "same-day reuse" and archived day views (theme/persona + paragraph/hardWords at minimum)

- [x] Recycled marker support in HardWordRow (AC: 4)
  - [x] If hard-words include recycled words, pass an `isRecycled` flag into `HardWordRow` and render `♺` marker (no paragraph-inline special casing)

## Dev Notes

- **Must-follow architecture patterns**
  - **Dexie access**: use `dexie-react-hooks` `useLiveQuery` for reactive reads where UI needs reactivity; do not keep duplicate in-memory mirrors of the collection list.  
    [Source: `_bmad-output/planning-artifacts/architecture.md` “Reactive bindings”]
  - **Zod schemas as source of truth**: recycle-word shape must come from `collection.schema.ts` via `z.infer<>` types, not hand-written TS duplicates.  
    [Source: `_bmad-output/planning-artifacts/architecture.md` “Persisted record shapes”]
  - **UTC timestamps**: `generatedAt` stored as UTC ISO datetime; day identifiers elsewhere are UTC `YYYY-MM-DD`.  
    [Source: `_bmad-output/planning-artifacts/architecture.md` “Date/time format (NFR13)”]
  - **Provider abstraction**: only `src/lib/llm/` imports provider SDKs; prompt-building stays inside `src/lib/llm/prompts/`.  
    [Source: `_bmad-output/planning-artifacts/architecture.md` “Provider abstraction (the central seam)”]

- **Guardrails to prevent common implementation mistakes**
  - Don’t “solve” morphological variants in code (no stemming/lemmatization). The AC allows morphological variance; the prompt should be the primary mechanism.
  - Cold-start must be silent and normal (no banner, no warning, no UI branching beyond generating without recycleWords).
  - Don’t add a visual indicator for recycled words inside the paragraph text itself (Q2 default). If needed, the only marker is the `♺` in `HardWordRow`.

- **Expected touchpoints (create if missing; update if present)**
  - `src/features/paragraph/select-recycle-words.ts` (new)
  - `src/lib/llm/prompts/paragraph.ts` (update)
  - `src/lib/llm/generate.ts` and/or `src/features/paragraph/use-generate-paragraph.ts` (update: pass recycleWords)
  - `src/lib/storage/db.ts` (verify `paragraphCache` table + indexes)
  - `src/lib/schemas/collection.schema.ts` (type source for recycle words)
  - `src/lib/schemas/paragraph-cache.schema.ts` (or equivalent) (persisted cache schema)
  - `src/components/audiblytics/HardWordRow.tsx` (optional: add recycled marker)
  [Source: `_bmad-output/planning-artifacts/architecture.md` “Folder decision tree” + “Project Tree”; `_bmad-output/planning-artifacts/epics.md` “Story 2.3”]

- **Manual validation (no test framework in MVP)**
  - With 0 saved words: Generate → paragraph succeeds; no mention of recycling
  - Save ≥2 words (Story 2.1), Generate again → paragraph includes 2–3 saved words naturally
  - Verify paragraph cache write occurred (same-day reuse in later Epic 4 depends on this)

### References

- `_bmad-output/planning-artifacts/epics.md` — Epic 2, Story 2.3
- `_bmad-output/planning-artifacts/prd.md` — FR15, FR16, FR21
- `_bmad-output/planning-artifacts/architecture.md` — provider seam + prompt builder, Dexie schema, UTC timestamps
- `_bmad-output/planning-artifacts/ux-design-specification.md` — `HardWordRow` recycled marker + Q2 default

## Dev Agent Record

### Agent Model Used

GPT-5.2

### Debug Log References

### Completion Notes List

- Recycle selection via `selectRecycleWords(CollectionWord[])`; Dexie load at generate/onboarding call sites.
- `ParagraphGeneratePayload` carries LLM result, recycle spellings for ♺ matching, and `cachePersist` Result; Today inline-surfaces cache failures.
- First-run gate: `useSyncExternalStore` SSR/client snapshot replaces prior effect-on-providerKeys (ESLint `set-state-in-effect`).
- `HardWordsList` hooks ordered before empty-state return.
- Verified locally: `pnpm typecheck`, `pnpm test`.

### File List

- `src/features/paragraph/select-recycle-words.ts` (new)
- `src/features/paragraph/select-recycle-words.test.ts` (new)
- `src/features/paragraph/persist-paragraph-cache.ts` (new)
- `src/features/paragraph/paragraph-generate-payload.ts` (new)
- `src/features/paragraph/use-generate-paragraph.ts`
- `src/lib/llm/prompts/paragraph.ts`
- `src/lib/llm/prompts/paragraph.test.ts` (new)
- `src/components/audiblytics/HardWordRow.tsx`
- `src/components/audiblytics/HardWordsList.tsx`
- `src/components/audiblytics/ParagraphHero.tsx`
- `src/components/audiblytics/OnboardingShell.tsx`
- `src/app/page.tsx`
- `package.json`
- `src/features/paragraph/persist-paragraph-cache.test.ts`

