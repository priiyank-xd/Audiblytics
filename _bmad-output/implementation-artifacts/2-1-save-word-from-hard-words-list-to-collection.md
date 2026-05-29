# Story 2.1: Save Word from Hard-Words List to Collection

Status: ready-for-dev

## Story

As Priyank,
I want a single tap on the save icon next to any hard word to persist that word to my IndexedDB collection with full metadata,
so that I build a personal vocabulary store without leaving the Today screen.

## Acceptance Criteria

1. **Given** today's paragraph and hard-words list have rendered  
   **When** the user taps the save icon next to a hard word  
   **Then** a new row is inserted into the Dexie `collection` table with fields `{id, word, ipa, meaning, exampleSentence, savedAt: ISO datetime UTC, sourceParagraphId, reviewCount: 0, lastReviewedAt: null, difficultyRating: 1}` validated against `collection.schema.ts`  
   **And** the save-icon flips from outline to filled state instantly (state-flip = success)  
   **And** no toast or success modal appears  
   [Source: `_bmad-output/planning-artifacts/epics.md` “Story 2.1”]

2. **Given** the IndexedDB write fails (simulate `QuotaExceededError`)  
   **When** the failure is caught  
   **Then** `<InlineErrorSurface variant="storage">` renders inline next to the failing row with `[Open Settings]` recovery  
   **And** the save-icon does NOT flip to filled state  
   [Source: `_bmad-output/planning-artifacts/epics.md` “Story 2.1”]

3. **Given** the user closes and reopens the browser  
   **When** the Today route renders the same paragraph and the user looks at the previously saved word  
   **Then** the save-icon shows the filled (saved) state  
   [Source: `_bmad-output/planning-artifacts/epics.md` “Story 2.1”]

4. **Given** the same word is already in the collection (duplicate save attempt)  
   **When** the user taps save again  
   **Then** the operation is a no-op (idempotent) and no error surfaces  
   [Source: `_bmad-output/planning-artifacts/epics.md` “Story 2.1”]

## Tasks / Subtasks

- [ ] Implement persistent “saved” state for each hard word row (AC: 1, 3)
  - [ ] Ensure `HardWordRow` supports `default` vs `saved` variants and uses icon flip (no toast)  
    [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` §`HardWordRow`]
  - [ ] Wire save button semantics: `aria-pressed` + `aria-label="Save <word> to collection"`  
    [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` §`HardWordRow`]

- [ ] Add “save word” write path to Dexie `collection` table (AC: 1, 4)
  - [ ] Ensure write is schema-validated (Zod) prior to Dexie write
  - [ ] Decide and enforce idempotency strategy:
    - [ ] **Preferred**: unique index on `(word, sourceParagraphId)` (or a stable deterministic `id`) so duplicates become no-ops
    - [ ] Alternative: query-before-insert (acceptable for ≤100 items, but keep logic in one place)
  - [ ] Store timestamps in UTC ISO datetime strings
  - [ ] Include `sourceParagraphId` from the currently-rendered paragraph record
  [Source: `_bmad-output/planning-artifacts/architecture.md` (Dexie + Zod patterns), `_bmad-output/planning-artifacts/epics.md` “Story 2.1”]

- [ ] Add storage-error surfacing path (AC: 2)
  - [ ] Catch Dexie write failures (including quota) and render `<InlineErrorSurface variant="storage">` inline adjacent to the failing row
  - [ ] Ensure no optimistic icon flip when persistence fails
  [Source: `_bmad-output/planning-artifacts/epics.md` “Story 2.1”; `_bmad-output/planning-artifacts/architecture.md` “Quota handling (FR42, NFR8)”]

## Dev Notes

- **Must-follow patterns**
  - **Storage**: Dexie (IndexedDB) for collection; wrap writes in `try/catch` and surface quota errors (no silent failures).  
    [Source: `_bmad-output/planning-artifacts/architecture.md` “Quota handling (FR42, NFR8)”]
  - **Validation**: Zod schemas are the single source of truth; derive TS types via `z.infer<>`.  
    [Source: `_bmad-output/planning-artifacts/architecture.md` “Validation” + schema examples]
  - **UX feedback**: Save is a **state flip** (outline → filled) with **no toast**.  
    [Source: `_bmad-output/planning-artifacts/epics.md` “Story 2.1”; `_bmad-output/planning-artifacts/ux-design-specification.md` §`HardWordRow`]

- **Expected touchpoints (create if missing; update if present)**
  - `src/components/audiblytics/HardWordRow.tsx` (save button click → handler; renders saved state; a11y labels)
  - `src/features/collection/use-save-word.ts` (idempotent insert; returns Result-shaped outcome)
  - `src/lib/storage/db.ts` (Dexie schema for `collection` table + indexes/constraints supporting idempotency)
  - `src/lib/schemas/collection.schema.ts` (Zod schema containing required fields and defaults)
  [Source: `_bmad-output/planning-artifacts/architecture.md` “Project Tree” + “Folder decision tree”]

- **A11y requirements**
  - Save button should be a real `<button>` with `aria-pressed` toggling false→true when saved; keyboard activatable via Enter/Space.  
    [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` §`HardWordRow`]

- **Testing**
  - MVP has **no test framework**; validate manually:
    - Save a word → refresh page → saved icon remains filled
    - Duplicate save attempt → no duplicate entry + no error surface
    - Simulated quota failure → error surface renders and icon does not flip
  [Source: `_bmad-output/planning-artifacts/architecture.md` “Testing Framework: None”]

### References

- `_bmad-output/planning-artifacts/epics.md` — Epic 2, Story 2.1
- `_bmad-output/planning-artifacts/ux-design-specification.md` — §`HardWordRow`
- `_bmad-output/planning-artifacts/architecture.md` — Dexie/Zod patterns; quota handling

## Dev Agent Record

### Agent Model Used

GPT-5.2

### Debug Log References

### Completion Notes List

### File List

