# Story 4.2: Day Completion Logic + "I Read It" Action

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Priyank,
I want my session marked complete when both (a) today's paragraph has been generated AND (b) either I tap "I read it" OR I save a recording,
so that my honest engagement is recognized regardless of whether I record on a given day.

## Acceptance Criteria

1. **Given** today's paragraph has been rendered  
   **When** the user inspects the bottom of the paragraph zone  
   **Then** an "I read it →" ghost-button is visible (per UX flow §J2, FR54)  
   **And** the button is single-tap with no confirmation modal (per NFR23, UX-DR30)  
   [Source: `_bmad-output/planning-artifacts/epics.md` § Epic 4 → Story 4.2; `_bmad-output/planning-artifacts/prd.md` FR54, NFR23; `_bmad-output/planning-artifacts/ux-design-specification.md` § Flow 2 — Daily Happy Path]

2. **Given** the user taps "I read it"  
   **When** the click fires  
   **Then** `features/calendar/use-mark-read-it.ts` runs and updates `audiblytics.completions[today] = { hasReadIt: true, ... }` via `useLocalStorage` (per FR54, AR11)  
   **And** `recordDayOfUse()` is called  
   [Source: `_bmad-output/planning-artifacts/epics.md` § Epic 4 → Story 4.2; `_bmad-output/planning-artifacts/architecture.md` “localStorage key naming” + “Day-counting primitive”; `_bmad-output/planning-artifacts/prd.md` FR54]

3. **Given** the user saves a recording (via Epic 3 Story 3.3) for today  
   **When** the recording write succeeds  
   **Then** `audiblytics.completions[today].hasRecording` becomes `true`  
   **And** `recordDayOfUse()` is called from `useSaveRecording`  
   [Source: `_bmad-output/planning-artifacts/epics.md` § Epic 4 → Story 4.2; `_bmad-output/planning-artifacts/prd.md` FR31; `_bmad-output/planning-artifacts/architecture.md` “Day-counting primitive”]

4. **Given** `evaluate-completion.ts` is called for any UTC date  
   **When** the function runs  
   **Then** it returns `true` IFF a paragraph was generated for that date (cache or offline pack) AND (`hasReadIt === true` OR `hasRecording === true`) (per FR53)  
   [Source: `_bmad-output/planning-artifacts/epics.md` § Epic 4 → Story 4.2; `_bmad-output/planning-artifacts/prd.md` FR53; `_bmad-output/planning-artifacts/architecture.md` “localStorage key naming” (`audiblytics.completions`) + completion evaluator mapping]

5. **Given** the day is marked complete  
   **When** the calendar surface re-renders  
   **Then** the corresponding day-cell turns forest-green (per Epic 4 Story 4.4)  
   [Source: `_bmad-output/planning-artifacts/epics.md` § Epic 4 → Story 4.2 + Story 4.4; `_bmad-output/planning-artifacts/ux-design-specification.md` § Color System / Semantic usage rules]

## Tasks / Subtasks

- [ ] **Task 1 — Persist completion state in `audiblytics.completions`** (AC: 2–4)
  - [ ] 1.1 Ensure `audiblytics.completions` shape exists as a Zod schema in `src/lib/schemas/completions.schema.ts` and is accessed only through `useLocalStorage<T>(key, defaultValue, schema)` (no raw `window.localStorage` in components).
  - [ ] 1.2 Ensure the per-day key uses UTC date string `YYYY-MM-DD` (computed via `formatUtcDate(new Date())` / day-counter utilities), not local date strings.
  - [ ] 1.3 Ensure the value for a date includes (at minimum) `hasReadIt`, `hasRecording`, and `usedOfflinePack` booleans (per architecture contract).

- [ ] **Task 2 — Implement the "I read it →" action hook** (AC: 1–2)
  - [ ] 2.1 Create `src/features/calendar/use-mark-read-it.ts` (NEW) that sets `audiblytics.completions[today].hasReadIt = true` and preserves existing flags for that day.
  - [ ] 2.2 In the same handler, call `recordDayOfUse()` (idempotent) to advance distinct-day count.
  - [ ] 2.3 Ensure the action is single-tap, no confirmation modal, no toast; success feedback is the calendar/day-rail re-render.

- [ ] **Task 3 — Ensure recording-save path sets completion flags** (AC: 3–4)
  - [ ] 3.1 In `src/features/voice-journal/use-save-recording.ts` (or the equivalent save hook), after a successful Dexie write, set `audiblytics.completions[today].hasRecording = true` (preserving other flags).
  - [ ] 3.2 Call `recordDayOfUse()` from the same successful path (not before the write succeeds).
  - [ ] 3.3 Ensure failures do not silently flip completion state; storage errors must surface inline (FR42).

- [ ] **Task 4 — Implement completion evaluation helper** (AC: 4)
  - [ ] 4.1 Create `src/features/calendar/evaluate-completion.ts` (NEW) as a pure function that answers: “is date completed?”
  - [ ] 4.2 Definition: paragraph-generated-for-date AND (hasReadIt OR hasRecording).
    - Paragraph-generated-for-date must consider cache/offline-pack; do not couple it to UI state.
  - [ ] 4.3 Keep it deterministic and UTC-keyed; never rely on local timezone arithmetic.

- [ ] **Task 5 — Wire UI affordance for "I read it →"** (AC: 1–2)
  - [ ] 5.1 Add the ghost-button to the Today screen paragraph zone footer (expected to be in `src/components/audiblytics/HonestyFooter.tsx` or the Today route composition, per existing UX composition).
  - [ ] 5.2 Ensure it’s visible whenever “today’s paragraph has been rendered” (i.e., not shown before a paragraph exists for today).
  - [ ] 5.3 On click: invoke `useMarkReadIt()` and allow reactive re-render of streak/day-rail/calendar surfaces.

- [ ] **Task 6 — Manual verification steps (no test framework in MVP)** (AC: 1–5)
  - [ ] 6.1 Generate a paragraph → confirm "I read it →" becomes visible.
  - [ ] 6.2 Tap "I read it" without recording → confirm today becomes completed (green dot) and streak updates.
  - [ ] 6.3 Save a recording without tapping "I read it" → confirm today becomes completed and streak updates.
  - [ ] 6.4 Ensure completion does NOT happen if no paragraph exists today (button hidden / no completion flag).
  - [ ] 6.5 Reload app → completion persists (localStorage) and is reflected in day-rail/calendar.

## Dev Notes

### Prerequisites / Dependencies

- Requires: storage substrate + day-counter primitive + basic Today screen paragraph rendering.
- Expected earlier stories: **1.1** scaffold, **1.4** storage foundations (Dexie + `useLocalStorage`), **1.10** Today screen, **3.2** UTC day-counter, **3.3** recording save hook, **4.1** paragraph cache reuse (optional but completion evaluation must still work when cached paragraph is used).

### Architecture & data-shape guardrails (must follow)

- **UTC day identifiers are non-negotiable** (NFR13): all completion keys are UTC `YYYY-MM-DD`; convert to local only at display boundaries.  
  [Source: `_bmad-output/planning-artifacts/architecture.md` “Date/time format (NFR13)” + “Day-counting primitive”]
- **localStorage access must go through `useLocalStorage`** with Zod validation; no raw `window.localStorage` usage in route/components.  
  [Source: `_bmad-output/planning-artifacts/architecture.md` “localStorage key naming” + “Reading/writing localStorage MUST go through the useLocalStorage hook”]
- **Completion state contract:** `audiblytics.completions` is the single source of truth for hasReadIt/hasRecording/usedOfflinePack; do not invent a second completion store in Dexie.  
  [Source: `_bmad-output/planning-artifacts/architecture.md` `audiblytics.completions` key contract; `_bmad-output/planning-artifacts/prd.md` FR53–FR54]
- **Error handling:** do not “mark complete” on failed recording writes; storage failures must surface inline (FR42) and leave completion unchanged.  
  [Source: `_bmad-output/planning-artifacts/prd.md` FR42; `_bmad-output/planning-artifacts/architecture.md` “Error handling pattern”]
- **No toast / no modal** for completion; success is state-flip UI (day-cell / day-rail / stat-card).  
  [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` “State-flip = success” + “No toasts” + NFR23]

### Expected file targets (create if missing; update if present)

- `src/features/calendar/use-mark-read-it.ts` (NEW) — updates `audiblytics.completions[today].hasReadIt`
- `src/features/calendar/evaluate-completion.ts` (NEW) — completion predicate used by calendar/day-rail/streak
- `src/features/voice-journal/use-save-recording.ts` (UPDATE) — sets `hasRecording` + calls `recordDayOfUse()` on successful save
- `src/lib/day-counter/index.ts` (READ) — must expose `recordDayOfUse()` and UTC semantics
- `src/lib/storage/use-local-storage.ts` (READ) — must be the only raw localStorage touch-point

### Common failure modes to avoid

- Using local-time dates for keys (breaks DST/timezone correctness).
- Marking completion before verifying the underlying success condition (paragraph exists; recording write succeeded).
- Duplicating completion logic in multiple places without a shared helper (drift risk).
- Coupling completion evaluation to UI state (“paragraph currently rendered”) instead of durable persisted facts.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` § Epic 4 → Story 4.2] — acceptance criteria + named file targets
- [Source: `_bmad-output/planning-artifacts/prd.md` FR53–FR54, NFR13, NFR23] — completion definition + constraints
- [Source: `_bmad-output/planning-artifacts/architecture.md` “localStorage key naming” (`audiblytics.completions`) + “Day-counting primitive”] — data contract + UTC semantics
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` Flow 2 (Daily Happy Path) + anti-shame principles] — ghost-button + one-tap rule

## Dev Agent Record

### Agent Model Used

GPT-5.2

### Debug Log References

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created

### File List

- `_bmad-output/implementation-artifacts/4-2-day-completion-logic-i-read-it-action.md`
