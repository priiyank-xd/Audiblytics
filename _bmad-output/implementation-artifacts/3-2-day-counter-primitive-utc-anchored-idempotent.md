# Story 3.2: Day-Counter Primitive (UTC-Anchored, Idempotent)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Priyank,
I want a `lib/day-counter/` module exposing `recordDayOfUse`, `distinctDaysOfUse`, `currentStreak`, and `isCompleted` — all UTC-anchored,
So that day-14 detection, streak computation, and 90-day pruning all share one correctness-critical primitive that handles DST/timezone/month boundaries identically.

## Acceptance Criteria

> Sourced verbatim from `epics.md § Story 3.2` (Epic 3). Re-formatted as numbered AC for traceability.

1. **AC1 — Day-counter exports exist and match signatures** (per AR13). In `src/lib/day-counter/index.ts`, export:
   - `recordDayOfUse(now?: Date): void`
   - `distinctDaysOfUse(): number`
   - `currentStreak(now?: Date): number`
   - `isCompleted(date: string): boolean`

2. **AC2 — UTC date formatter exists** (per NFR13). `src/lib/day-counter/format-utc-date.ts` exports a UTC `'YYYY-MM-DD'` formatter.

3. **AC3 — Distinct day-of-use hook exists** (per AR13). `src/lib/day-counter/use-distinct-day-of-use.ts` exports a React hook wrapping the localStorage read for `audiblytics.daysOfUse`.

4. **AC4 — `recordDayOfUse` is idempotent within a UTC day** (per AR13). Calling `recordDayOfUse(now)` twice in the same UTC day does not change `audiblytics.daysOfUse: string[]`; calling it on a new UTC day appends the new date.

5. **AC5 — UTC anchoring is used even when local day differs** (per NFR13). If the user’s local date differs from UTC near midnight, `recordDayOfUse()` records the UTC date (not local), maintaining correctness across DST/timezone changes.

6. **AC6 — `currentStreak` resets cleanly on any gap** (per FR57, NFR13). With `audiblytics.daysOfUse = ['2026-05-01','2026-05-02','2026-05-04']`, `currentStreak(new Date('2026-05-04T12:00:00Z'))` returns `1`.

7. **AC7 — `distinctDaysOfUse` reflects the stored set size** (per NFR12). With 14 distinct UTC dates in `audiblytics.daysOfUse`, `distinctDaysOfUse()` returns `14`.

### BDD format (verbatim mirror of `epics.md § Story 3.2`)

**Given** `src/lib/day-counter/index.ts` is opened  
**When** the file is read  
**Then** `recordDayOfUse(now?: Date): void`, `distinctDaysOfUse(): number`, `currentStreak(now?: Date): number`, and `isCompleted(date: string): boolean` are exported (per AR13)  
**And** `format-utc-date.ts` exports a `'YYYY-MM-DD'` UTC formatter (per NFR13)  
**And** `use-distinct-day-of-use.ts` exports a React hook wrapping the localStorage read  

**Given** `recordDayOfUse(now)` is called twice in the same UTC day  
**When** the second call runs  
**Then** `audiblytics.daysOfUse: string[]` is unchanged (idempotent, per AR13)  
**And** when called on a new UTC day, the new date is appended  

**Given** the user is in a timezone where the local date differs from UTC near midnight  
**When** `recordDayOfUse()` is called  
**Then** the UTC date is recorded (NOT the local date), so day-counting is consistent across DST transitions and timezone changes (per NFR13)  

**Given** `audiblytics.daysOfUse` contains `['2026-05-01', '2026-05-02', '2026-05-04']` (a one-day gap)  
**When** `currentStreak(new Date('2026-05-04T12:00:00Z'))` is called  
**Then** the result is `1` (today only — the streak resets cleanly on the gap, per FR57, NFR13)  

**Given** `audiblytics.daysOfUse` contains 14 distinct UTC dates  
**When** `distinctDaysOfUse()` is called  
**Then** the result is `14` (used by Epic 7 Day-14 trigger, per NFR12)  

## Tasks / Subtasks

- [x] **Task 0 — Pre-req: project scaffold exists** (AC: all)
  - [x] 0.1 Confirm Story 1.1 has been completed (Next.js app scaffold exists with `src/` tree). If the repo root contains only `_bmad-output/` artifacts, complete 1.1 first.

- [x] **Task 1 — Read files being modified (UPDATE — non-negotiable)** (AC: all)
  - [x] 1.1 If any of these exist already, read fully and document current behavior and edge cases:
    - `src/lib/day-counter/index.ts`
    - `src/lib/day-counter/format-utc-date.ts`
    - `src/lib/day-counter/use-distinct-day-of-use.ts`
  - [x] 1.2 Read `src/lib/storage/use-local-storage.ts` to match the project’s localStorage access/validation pattern (architecture forbids raw `window.localStorage.getItem` in component code).
  - [x] 1.3 Read `src/lib/schemas/days-of-use.schema.ts` and `src/lib/schemas/completions.schema.ts` (or equivalents) so this module’s read/write logic matches the intended persisted shapes.

- [x] **Task 2 — Implement the UTC date formatter** (AC: 2, 5)
  - [x] 2.1 Create `src/lib/day-counter/format-utc-date.ts` exporting `formatUtcDate(now?: Date): string` returning UTC `YYYY-MM-DD`.
  - [x] 2.2 Ensure the formatter uses UTC fields (e.g., `getUTCFullYear()`, `getUTCMonth() + 1`, `getUTCDate()`) and is stable across DST and timezone changes.

- [x] **Task 3 — Implement the day-counter primitives** (AC: 1, 4, 6, 7)
  - [x] 3.1 In `src/lib/day-counter/index.ts`, implement:
    - `recordDayOfUse(now = new Date()): void`:
      - Compute `utcDate = formatUtcDate(now)`
      - Read `audiblytics.daysOfUse` (string[]) from localStorage via the project’s storage wrapper
      - If missing/invalid, treat as `[]`
      - If already includes `utcDate`, no-op
      - Else append `utcDate`
    - `distinctDaysOfUse(): number`:
      - Return the length of the stored array (treat invalid as 0)
    - `currentStreak(now = new Date()): number`:
      - Compute today’s `utcDate`
      - Walk backwards day-by-day in UTC while consecutive dates exist in the set
      - Return the count; any gap yields reset (e.g. example AC6)
    - `isCompleted(date: string): boolean`:
      - Read `audiblytics.completions` map (UTC-date keyed) and interpret completion based on the canonical rule from architecture/PRD:
        - completed iff `hasReadIt === true` OR `hasRecording === true` (the “paragraph generated” precondition is handled elsewhere, not by this function)
  - [x] 3.2 Keep this module pure and deterministic given localStorage state; no React imports here.

- [x] **Task 4 — Implement the React hook wrapper** (AC: 3)
  - [x] 4.1 Create `src/lib/day-counter/use-distinct-day-of-use.ts` exporting `useDistinctDayOfUse(): number`.
  - [x] 4.2 Internally, use the project’s `useLocalStorage` hook against `audiblytics.daysOfUse`, returning the array length. Ensure SSR safety (don’t assume `window` exists during server render).

- [ ] **Task 5 — Minimal invariants & sanity checks (manual)** (AC: 4, 5, 6)
  - [ ] 5.1 In dev, call `recordDayOfUse()` twice and confirm only one entry is added for the UTC day.
  - [ ] 5.2 Simulate a gap in `audiblytics.daysOfUse` and verify `currentStreak()` returns 1 on the “today” date.
  - [ ] 5.3 Verify behavior near local midnight with UTC mismatch by temporarily mocking `now` and ensuring the stored date tracks UTC, not local.

## Dev Notes

### What this story owns vs. defers

- This story owns the **UTC-anchored day semantics** (NFR13) and a single canonical primitive used by:
  - Day-14 trigger gating (Epic 7)
  - Streak computation and calendar/rail rendering (Epic 4)
  - Voice-journal retention pruning keyed by day-of-use (Epic 3.6)
- This story does **not** implement the Day-14 takeover UX, calendar UI, or retention pruning logic; it only supplies correct day/streak primitives.
- This story should not “smuggle in” UI decisions; its output is pure numbers and booleans derived from localStorage.

### Disaster-prevention notes (common pitfalls)

- **UTC vs local is not optional.** Use UTC date strings for persistence (`YYYY-MM-DD`) and compute streak by stepping dates in UTC. Any local-time persistence (`toLocaleDateString`) will break on DST and travel (explicitly forbidden by NFR13).
- **Idempotence matters.** Many flows will call `recordDayOfUse()` (on app open, on recording save, on “I read it”); duplicates must never accumulate.
- **Do not re-invent storage access.** If the architecture provides `useLocalStorage` + Zod validation, use it. Raw `window.localStorage.getItem` usage should be isolated to that wrapper.
- **Keep module boundaries clean.** `src/lib/day-counter/index.ts` must not import from `features/` or `components/` (architecture import direction rules).

### Project Structure Notes

- File placement is fixed by architecture:
  - `src/lib/day-counter/index.ts`
  - `src/lib/day-counter/format-utc-date.ts`
  - `src/lib/day-counter/use-distinct-day-of-use.ts`
- Storage keys are fixed and namespaced (architecture):
  - `audiblytics.daysOfUse` (string[] of UTC dates)
  - `audiblytics.completions` (map keyed by UTC date → `{ hasReadIt, hasRecording, usedOfflinePack }`)

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` § Epic 3 → Story 3.2] — story statement + BDD acceptance criteria
- [Source: `_bmad-output/planning-artifacts/prd.md` FR57, NFR13] — streak semantics and UTC-anchored day IDs
- [Source: `_bmad-output/planning-artifacts/architecture.md` § Day-counting primitive + localStorage key map] — required module layout and storage-key contract

## Dev Agent Record

### Context Reference

- Sprint tracking indicates this story was in backlog and is now contexted as ready-for-dev.
- No `project-context.md` files were found in the workspace at story-creation time.

### Agent Model Used

GPT-5.2

### Debug Log References

### Completion Notes List

- Added `readDaysOfUse` / `writeDaysOfUse` / `readCompletions` on `use-local-storage.ts` so `lib/day-counter` never touches `localStorage` directly (AR12).
- `recordDayOfUse`, `distinctDaysOfUse`, `currentStreak`, `isCompleted` in `src/lib/day-counter/index.ts`; `formatUtcDate` in `format-utc-date.ts`; `useDistinctDayOfUse` wraps `useLocalStorage` and returns **distinct** day count (`new Set(days).size`) aligned with `distinctDaysOfUse()`.
- Today page uses `useDistinctDayOfUse()` for the day rail number.
- Unit tests: `format-utc-date.test.ts`, `day-counter.test.ts` (in-memory `localStorage`). `pnpm typecheck` + `pnpm test` green.
- Task 5 manual checks (dev double-call, gap streak, local vs UTC) still optional in browser.

### File List

- `src/lib/storage/use-local-storage.ts`
- `src/lib/day-counter/format-utc-date.ts`
- `src/lib/day-counter/format-utc-date.test.ts`
- `src/lib/day-counter/index.ts`
- `src/lib/day-counter/day-counter.test.ts`
- `src/lib/day-counter/use-distinct-day-of-use.ts`
- `src/app/page.tsx`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
