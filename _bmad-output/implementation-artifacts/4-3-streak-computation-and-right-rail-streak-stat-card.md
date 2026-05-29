# Story 4.3: Streak Computation and Right-Rail Streak Stat-Card

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Priyank,
I want my current streak (consecutive completed days ending today) computed from completion data and displayed as a `STREAK · N days` stat-card in the right rail,
so that the loop's stickiness is honest data, never gamified celebration.

## Acceptance Criteria

1. **Given** `features/calendar/use-streak.ts` is opened  
   **When** the file is read  
   **Then** the hook derives the streak by calling `currentStreak` from `lib/day-counter/` with `new Date()` as the anchor **and** wiring completion semantics so only **completed** UTC days count (per FR57, AR13) — i.e. the same predicate as `evaluate-completion.ts` from Story 4.2 (paragraph generated for that UTC date **and** (`hasReadIt` OR `hasRecording`)).  
   **And** the value re-computes whenever `audiblytics.completions` changes via `useLocalStorage` **and** whenever inputs to `evaluate-completion` change (at minimum: completions + paragraph existence for relevant dates — typically `paragraphCache` / offline-pack signals as defined in Story 4.2).  
   [Source: `_bmad-output/planning-artifacts/epics.md` § Epic 4 → Story 4.3; `_bmad-output/planning-artifacts/prd.md` FR57; `_bmad-output/planning-artifacts/architecture.md` `use-streak.ts` + `lib/day-counter`]

2. **Given** the streak hook is mounted on the Today route  
   **When** the right rail renders  
   **Then** a `<StatCardLight>` shows `STREAK` micro-label + body text `N days` (or `1 day` / `0 days` per English plural rules) (per UX-DR16)  
   **And** when N=0, the card shows `STREAK` + `0 days` only — **no** motivational or shame copy (per UX-DR22, UX-DR34)  
   [Source: `_bmad-output/planning-artifacts/epics.md` § Story 4.3; `_bmad-output/planning-artifacts/ux-design-specification.md` § `StatCardLight`; `_bmad-output/planning-artifacts/prd.md` FR58, NFR22]

3. **Given** the user has a 7-day streak and misses Day 8  
   **When** they open the app on Day 9  
   **Then** the streak card reads **`STREAK`** + **`1 day`** (today only) — streak resets cleanly on the gap (per FR57)  
   **And** no modal, banner, or warning copy appears anywhere about the broken streak (per FR58, NFR22, UX-DR30)  
   [Source: `_bmad-output/planning-artifacts/epics.md` § Story 4.3]

4. **Given** the streak render measurement  
   **When** the page mounts  
   **Then** streak + calendar-adjacent surfaces meet **<100ms** render budget for this interaction (per NFR6) — implementation stays synchronous/local reads only; no network; avoid redundant deep work on each render.  
   [Source: `_bmad-output/planning-artifacts/epics.md` § Story 4.3; `_bmad-output/planning-artifacts/prd.md` NFR6]

## Tasks / Subtasks

- [ ] **Task 1 — Implement streak counting in `lib/day-counter` (completed-day semantics)** (AC: 1, 3–4)
  - [ ] 1.1 Implement `currentStreak` as a **pure** walk backward from the anchor UTC date (`formatUtcDate(now)`): count consecutive UTC calendar days for which “complete” is true, stopping at the first gap. **Do not** equate streak to `audiblytics.daysOfUse` length or consecutive entries in that array unless proven identical to FR57 completion definition (they are not — FR57 is completion-based).
  - [ ] 1.2 Prefer signature shape: `currentStreak(anchor: Date, isUtcDayComplete: (utcDate: string) => boolean): number` exported from `src/lib/day-counter/index.ts` (or adjacent module re-exported there). The **`features/calendar/use-streak.ts`** hook supplies `isUtcDayComplete` by delegating to **`evaluate-completion`** so paragraph + completions rules stay single-sourced (Story 4.2).
  - [ ] 1.3 Keep all date arithmetic **UTC-keyed** (NFR13); reuse `formatUtcDate` / existing day-counter helpers — no `Date` “midnight” math in local timezone for streak boundaries.

- [ ] **Task 2 — Add `use-streak.ts` reactive wrapper** (AC: 1)
  - [ ] 2.1 Create `src/features/calendar/use-streak.ts`: subscribe to `audiblytics.completions` via `useLocalStorage`; subscribe to whatever durable inputs `evaluate-completion` needs for the rolling window (paragraph cache / offline pack flags per architecture).
  - [ ] 2.2 Return the numeric streak (0 allowed). Memoize invalidation keys so NFR6 stays plausible — avoid recomputing 90-day scans on unrelated renders unless inputs changed.

- [ ] **Task 3 — `StatCardLight` + StatRail wiring on Today** (AC: 2–3)
  - [ ] 3.1 Implement or complete `src/components/audiblytics/StatCardLight.tsx` per UX spec (cream background, ALL-CAPS micro-label `--ink-faint`, body `--ink`, `aria-label` like `"Streak: N days"`).
  - [ ] 3.2 Replace/remove the StatRail placeholder card on the Today route composition: render at least the **Streak** `StatCardLight` fed by `use-streak()` (other StatCards remain future stories — do not block on Words/Recordings).
  - [ ] 3.3 Copy rules: **N = 0** → body `0 days`; **N = 1** → `1 day`; **N ≥ 2** → `N days`. Label remains `STREAK` (UX-DR16). No emoji, no “🔥”, no exclamation.

- [ ] **Task 4 — Verify gap reset + anti-celebration** (AC: 3)
  - [ ] 4.1 Manual: simulate completed run → missed day → next completion shows `1 day`; confirm **no** streak-broken UI anywhere.

- [ ] **Task 5 — Performance sanity** (AC: 4)
  - [ ] 5.1 Manual DevTools: Today route mount should not show layout thrash from streak; keep computation O(streak length) not O(year).

## Dev Notes

### Previous story intelligence (4.2)

- `evaluate-completion.ts` is the **single** predicate for “day complete” (paragraph generated + read-it OR recording); streak logic must call it (or a thin wrapper) per date — **never** duplicate its rules in `lib/day-counter`.
- `audiblytics.completions` keys are UTC `YYYY-MM-DD`; `use-mark-read-it` / `use-save-recording` already persist engagement flags — `use-streak` should treat completions JSON updates as the primary subscription surface + any cache inputs the evaluator needs.
- No toast/modal on state change; UI feedback is stat-card / calendar visuals only.

### Prerequisites / Dependencies

- **Story 4.2** delivers `evaluate-completion.ts`, `audiblytics.completions` wiring, and recording/read-it paths — streak **must** reuse that evaluator for “complete” (do not fork completion rules).
- **Story 3.2** day-counter UTC primitives; **4.1** paragraph cache behavior informs “paragraph exists for date” inside evaluator.

### Architecture & layering (must follow)

- **`lib/` MUST NOT import `features/`** — if `currentStreak` lives in `lib/day-counter`, it accepts a **predicate callback** (or equivalent parameters) provided by `use-streak`; `evaluate-completion` stays in `features/calendar/` (matches architecture tree).
- **localStorage:** only via `useLocalStorage` + Zod schemas in components/hooks — not raw `window.localStorage` in route code.
- **Components:** `StatCardLight` lives under `src/components/audiblytics/`; hook under `src/features/calendar/` per architecture file tree.
- **Import direction:** `app/` → `components/`, `features/`, `lib/` only.

### UX guardrails (anti-shame)

- Quiet competence only (UX spec “Quiet competence” table): show the number, no celebration vocabulary.
- No toast/modal on streak change (NFR23 / UX state-flip discipline).

### Expected file targets

| Action | Path |
|--------|------|
| UPDATE | `src/lib/day-counter/index.ts` — export `currentStreak` with completion predicate pattern |
| NEW | `src/features/calendar/use-streak.ts` |
| NEW or UPDATE | `src/components/audiblytics/StatCardLight.tsx` |
| UPDATE | Today route / shell component that composes `StatRail` (e.g. `app/page.tsx` or layout wrapper per project) |
| READ | `src/features/calendar/evaluate-completion.ts` (Story 4.2) |
| READ | `src/lib/storage/use-local-storage.ts`, `src/lib/schemas/completions.schema.ts` |

### Common failure modes to avoid

- Streak based on `daysOfUse` alone → **wrong** vs FR57 (completion requires paragraph + engagement).
- Local-time “yesterday” → breaks NFR13.
- Importing `evaluate-completion` into `lib/day-counter` → **violates** layer boundaries.
- Gamified microcopy or streak-lost warnings → violates FR58 / UX-DR22 / UX-DR34.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` § Epic 4 → Story 4.3]
- [Source: `_bmad-output/planning-artifacts/prd.md` FR57–FR58, NFR6, NFR13, NFR22]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — `lib/day-counter`, `features/calendar/use-streak.ts`, component tree `StatCardLight`, localStorage keys]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` — `StatCardLight` anatomy + right-rail composition]

## Dev Agent Record

### Agent Model Used

GPT-5.2

### Debug Log References

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created

### File List

- `_bmad-output/implementation-artifacts/4-3-streak-computation-and-right-rail-streak-stat-card.md`
