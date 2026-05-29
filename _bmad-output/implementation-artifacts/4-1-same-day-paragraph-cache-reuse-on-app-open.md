# Story 4.1: Same-Day Paragraph Cache Reuse on App Open

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Priyank,
I want today's previously generated paragraph to render instantly when I reopen the app within the same UTC day,
so that I don't burn an extra LLM call or wait for regeneration when I revisit the tab to record or save a word.

## Acceptance Criteria

1. **Given** the user generated a paragraph earlier today and the entry exists in `paragraphCache`  
   **When** the user closes and reopens the tab on the same UTC date  
   **Then** `useParagraphOfTheDay()` reads `paragraphCache` via `useLiveQuery` and returns the cached entry (per FR19, AR10)  
   **And** the `<ParagraphHero>` renders the cached paragraph immediately (no spinner, no LLM call)  
   **And** the hard-words list renders normally  
   [Source: `_bmad-output/planning-artifacts/epics.md` § Epic 4 → Story 4.1]

2. **Given** the user crosses a UTC midnight boundary  
   **When** the app opens on the new UTC date  
   **Then** the cached entry from yesterday is NOT used as today's paragraph  
   **And** the Today screen shows the manual `Generate` button (per FR14 — no auto-generation)  
   [Source: `_bmad-output/planning-artifacts/epics.md` § Epic 4 → Story 4.1]

3. **Given** no cached entry exists for today  
   **When** the app opens  
   **Then** the Today screen shows the `Generate` button (per Epic 1 Story 1.10)  
   [Source: `_bmad-output/planning-artifacts/epics.md` § Epic 4 → Story 4.1; `_bmad-output/implementation-artifacts/1-10-today-screen-paragraph-hero-with-manual-generate-action.md`]

## Tasks / Subtasks

- [ ] **Task 1 — Implement `useParagraphOfTheDay()` cache-read hook** (AC: 1–3)
  - [ ] 1.1 Create `src/features/paragraph/use-paragraph-of-the-day.ts` (NEW, `"use client"`).
  - [ ] 1.2 Read today’s UTC date string via `formatUtcDate(new Date())` from `src/lib/day-counter/format-utc-date.ts` (Story 3.2 owns day-counter implementation; if missing, implement 3.2 before this story).
  - [ ] 1.3 Use `useLiveQuery` to query the Dexie table `db.paragraphCache` for entries whose `generatedAt` is within today’s UTC day bounds:
    - Lower bound: `${today}T00:00:00.000Z`
    - Upper bound: `${today}T23:59:59.999Z`
    - Use the `generatedAt` index (AR10 / architecture schema) so this remains fast.
  - [ ] 1.4 Return the most recent cached entry for today (reverse by `generatedAt`, first match).
  - [ ] 1.5 Ensure the hook returns a stable shape, e.g.:
    - `{ status: 'hit', cached: CachedParagraph }` or `{ status: 'miss' }`
    - Do not throw for “miss”; a miss is a normal state.

- [ ] **Task 2 — Wire cache reuse into the Today route without auto-generation** (AC: 1–3)
  - [ ] 2.1 Update `src/app/page.tsx` (UPDATE) to call `useParagraphOfTheDay()` early in the Today route rendering path.
  - [ ] 2.2 If cache status is `hit`, render `<ParagraphHero>` immediately with the cached paragraph and render the hard-words list as usual.
  - [ ] 2.3 If cache status is `miss`, render the manual `Generate` CTA per Story 1.10 (no auto-fire).
  - [ ] 2.4 Confirm the Generate button still triggers the same generation path as before (Story 1.10 / 1.5 / 2.3), and that success still writes into `paragraphCache` (Story 2.3 AC3).

- [ ] **Task 3 — UTC-midnight correctness guardrail** (AC: 2)
  - [ ] 3.1 Ensure “today” is computed in UTC (not local time). This must remain correct across DST/timezone changes (NFR13).
  - [ ] 3.2 Ensure the cache query is bounded to the UTC day window (not “last 24 hours”).

- [ ] **Task 4 — Manual verification steps (no test framework in MVP)** (AC: 1–3)
  - [ ] 4.1 Generate a paragraph (verify cache write happens via Story 2.3).
  - [ ] 4.2 Reload/close+reopen the tab within the same UTC day → paragraph renders instantly; no “Generating…” state appears; no network call.
  - [ ] 4.3 Advance across a UTC midnight boundary (or mock the date) → cached paragraph not used; Generate CTA shown.

## Dev Notes

### Prerequisites / Dependencies

- This story assumes the app scaffold and storage substrate exist.
  - Required earlier stories: **1.1** (scaffold), **1.4** (Dexie + schemas + `db` singleton), **1.10** (Today route + ParagraphHero), **2.3** (write accepted generations into `paragraphCache`), **3.2** (UTC day-counter primitive / `formatUtcDate`).
- At story-creation time, no `src/` tree exists in the repo; implementation will be blocked until scaffolding is implemented.

### Architecture & data-shape guardrails (must follow)

- **Dexie access**: read cache reactively with `dexie-react-hooks` `useLiveQuery`; do not mirror paragraphCache into separate React state “just for rendering.”  
  [Source: `_bmad-output/planning-artifacts/architecture.md` “Reactive bindings”]
- **Use the `generatedAt` index** for same-day lookup and bound the query to UTC day windows.  
  [Source: `_bmad-output/planning-artifacts/architecture.md` “Dexie schema” + index rationale for `paragraphCache.generatedAt`]
- **UTC semantics are non-negotiable**: the day identifier is UTC `YYYY-MM-DD` and timestamps are UTC ISO datetimes (NFR13).  
  [Source: `_bmad-output/planning-artifacts/architecture.md` “Date/time format (NFR13)”]
- **No auto-generation on mount**: this story only rehydrates a previously generated paragraph; it must not introduce auto-generation when missing.  
  [Source: `_bmad-output/planning-artifacts/epics.md` Story 4.1; `_bmad-output/planning-artifacts/prd.md` FR14; `_bmad-output/implementation-artifacts/1-10-today-screen-paragraph-hero-with-manual-generate-action.md`]

### Expected file targets (create if missing; update if present)

- `src/features/paragraph/use-paragraph-of-the-day.ts` (NEW) — reads same-UTC-day cached paragraph via `useLiveQuery`
- `src/app/page.tsx` (UPDATE) — Today route uses cache hit to render instantly
- `src/lib/storage/db.ts` (UPDATE/READ) — must expose `db.paragraphCache` table per Story 1.4
- `src/lib/day-counter/format-utc-date.ts` (UPDATE/READ) — must exist for UTC-day keying per architecture

### Common failure modes to avoid

- Reading “today” in local time (breaks DST/timezone correctness).
- Using “last 24 hours” instead of “same UTC date.”
- Querying all cache rows then filtering in JS (wastes IndexedDB time; bypasses `generatedAt` index).
- Accidentally triggering the LLM generate flow on mount when cache is missing (violates FR14 / Story 1.10).

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` § Epic 4 → Story 4.1] — acceptance criteria and intent
- [Source: `_bmad-output/planning-artifacts/architecture.md` § Data Architecture / Dexie schema] — `paragraphCache` index on `generatedAt`, `useLiveQuery` guidance
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` § Returning user open flow (FR19)] — “Returning user open → today’s paragraph already on screen”
- [Source: `_bmad-output/implementation-artifacts/1-10-today-screen-paragraph-hero-with-manual-generate-action.md`] — Today route behavior + manual Generate rule
- [Source: `_bmad-output/implementation-artifacts/2-3-recycle-2-3-saved-words-into-generated-paragraphs.md`] — required cache write after successful generation

## Dev Agent Record

### Agent Model Used

GPT-5.2

### Debug Log References

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created

### File List

- `_bmad-output/implementation-artifacts/4-1-same-day-paragraph-cache-reuse-on-app-open.md`

