# Story 4.4: Calendar Route — 30/60/90-Day Toggle Grid with Honest Empty Cells

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Priyank,
I want a `/calendar` route showing the last 30/60/90 days as a green-dot grid with missed days rendered as empty grey cells,
so that my daily-use pattern is visible without ever shaming a missed day.

## Acceptance Criteria

1. **Given** the user navigates to `/calendar` (via any exposed affordance — e.g. TopNav link, DayRail deep-link pattern, or direct URL per architecture secondary routes)  
   **When** the route renders  
   **Then** the page shows a **30 / 60 / 90** window toggle with **default 30** and a calendar **grid** covering that many trailing UTC calendar days ending at **today** (per FR55)  
   **And** each day-cell’s completion state is derived **only** from `evaluate-completion.ts` (Story 4.2) for that UTC `YYYY-MM-DD` — **do not** duplicate completion logic in the grid composer  
   [Source: `_bmad-output/planning-artifacts/epics.md` § Story 4.4; `_bmad-output/planning-artifacts/prd.md` FR55; `_bmad-output/planning-artifacts/architecture.md` `features/calendar/evaluate-completion.ts` + `use-calendar-grid.ts`]

2. **Given** a UTC day evaluates **complete** via `evaluate-completion`  
   **When** its cell renders  
   **Then** the cell shows a **solid forest-green** completion indicator (semantic `--forest` / primary accent per UX color discipline — match DayRail `completed` dot treatment)  
   [Source: `_bmad-output/planning-artifacts/epics.md` § Story 4.4; `_bmad-output/planning-artifacts/ux-design-specification.md` § DayRail states / Color System]

3. **Given** a UTC day is **not** complete (missed)  
   **When** its cell renders  
   **Then** the cell shows an **empty grey ring** using **`--border`** stroke and label styling **`text-ink-faint`** (per FR58, UX-DR9 missed state)  
   **And** **no** red, warning glyph, exclamation, shame copy, tooltip nag, toast, or modal about the missed day appears  
   [Source: `_bmad-output/planning-artifacts/epics.md` § Story 4.4; `_bmad-output/planning-artifacts/prd.md` FR58, NFR22; `_bmad-output/planning-artifacts/ux-design-specification.md` § DayRail `missed`]

4. **Given** the URL is `/calendar` **without** a `day` query parameter (or `day` absent / empty such that no archived-day selection is active — **only** query param allowed app-wide is `/calendar?day=N` per architecture)  
   **When** the route renders  
   **Then** the **grid is the only main content** — **no** archived-day detail panel (Story 4.5 owns `?day=` archive UI below the grid)  
   [Source: `_bmad-output/planning-artifacts/epics.md` § Story 4.4; `_bmad-output/planning-artifacts/architecture.md` URL query contract]

5. **Given** the grid renders up to **90** cells (90-day mode)  
   **When** cells paint  
   **Then** render completes within **<100ms** local-read budget (per NFR6) — synchronous `localStorage`/Dexie reads only; **no** network  
   **And** layout **does not** introduce **horizontal scroll** on viewports **≥320px** (per UX-DR7)  
   [Source: `_bmad-output/planning-artifacts/epics.md` § Story 4.4; `_bmad-output/planning-artifacts/prd.md` NFR6; `_bmad-output/planning-artifacts/ux-design-specification.md` UX-DR7]

## Tasks / Subtasks

- [ ] **Task 1 — `use-calendar-grid.ts` (feature hook)** (AC: 1, 5)
  - [ ] 1.1 Implement `src/features/calendar/use-calendar-grid.ts` per architecture tree: given `windowDays ∈ {30,60,90}`, produce an ordered list of UTC date strings from **(today − window + 1)** through **today** inclusive (inclusive count = `windowDays`), using **`formatUtcDate`** / day-counter helpers — **no** local-midnight arithmetic for boundaries (NFR13).
  - [ ] 1.2 For each date string, compute `complete = evaluateCompletion({ utcDate, … })` with the **same inputs** Story 4.2/4.3 use (completions + paragraph-cache/offline-pack signals per evaluator signature). Subscribe reactively via `useLocalStorage` / `useLiveQuery` as needed so toggling read-it/recording/cache updates the grid without reload.
  - [ ] 1.3 Memoize so switching toggle or unrelated renders does not redo O(90) work unnecessarily (stabilize dependency keys for NFR6).

- [ ] **Task 2 — `/calendar` route page** (AC: 1, 4)
  - [ ] 2.1 Add **`src/app/calendar/page.tsx`** as a **client** route (matches architecture `calendar/page.tsx`); compose existing shell (TopNav / DayRail / StatRail as other secondary routes do).
  - [ ] 2.2 Implement **30 | 60 | 90** segmented control (or three minimal text toggles) — **default 30**; changing toggle updates grid row/column layout while preserving token styling (cream/ink/forest).
  - [ ] 2.3 When `searchParams.day` is **unset** or empty, render **grid only** — **do not** mount Story 4.5’s archived-day panel (stub absence explicitly if `use-archived-day.ts` exists but panel UI belongs to 4.5).

- [ ] **Task 3 — Grid cell UI component** (AC: 2–3)
  - [ ] 3.1 Implement a small presentational component (e.g. `CalendarDayCell` under `src/components/audiblytics/`) mapping evaluator outcome → **forest dot** vs **grey ring** + faint label; mirror DayRail semantics for consistency.
  - [ ] 3.2 **Accessibility:** grid as `role="grid"` or `role="list"` with per-cell labels like `"May 6, completed"` / `"May 6, missed"` (avoid announcing judgment language).

- [ ] **Task 4 — Navigation affordance** (AC: 1)
  - [ ] 4.1 Ensure users can open `/calendar` without typing the URL: wire a **Calendar** link consistent with architecture’s secondary routes (update `TopNav` if it still lists only Today/Collection/Review/Settings — architecture enumerates `/calendar` as a first-class route; align UX implementation with route map).
  - [ ] 4.2 Do **not** implement Story 4.5 cell navigation in this story unless already required for shell consistency — **tap-to-archive** is Story 4.5.

- [ ] **Task 5 — Verification** (AC: 3–5)
  - [ ] 5.1 Manual: all-missed profile → all grey rings, zero reds/toasts.
  - [ ] 5.2 Manual: DevTools Performance shallow check on `/calendar` mount with 90-cell mode.
  - [ ] 5.3 Manual: viewport 320px wide → no horizontal scrollbar on grid container.

## Dev Notes

### Previous story intelligence (4.3 / 4.2)

- **`evaluate-completion.ts`** is the **single** predicate for “complete” — the grid **must** call it per UTC date (same rule chain as streak in 4.3). Never re-embed FR53 logic in UI.
- **`use-streak.ts`** (4.3) already couples to completions + evaluator inputs — calendar grid should share subscription patterns (completions JSON + paragraph cache visibility) so streak and calendar never drift.
- **Anti-shame:** identical discipline as streak card — no modal/banner/toast on gaps (FR58, NFR22).

### Prerequisites / Dependencies

- **4.2** — `evaluate-completion.ts`, `audiblytics.completions`, read-it + recording paths.
- **4.1** — paragraph cache informs “paragraph exists for date” inside evaluator.
- **4.3** — streak/stat-card patterns optional reference for reactive localStorage wiring.

### Architecture & layering (must follow)

- **`src/app/calendar/page.tsx`** — client route; imports `components/*`, `features/calendar/*`, `lib/*` only (import direction per architecture “Architectural Boundaries”).
- **`src/features/calendar/use-calendar-grid.ts`** — NEW per architecture file tree (FR55 composer).
- **`lib/` MUST NOT import `features/`** — grid hook lives in `features/`; keep day arithmetic helpers in `lib/day-counter` if reused.
- **URL contract:** only `/calendar?day=N` query param app-wide — Story 4.4 respects absence of `day`; Story 4.5 adds archive behavior when `day` is set.

### UX guardrails

- Missed cell = **quiet** empty ring (`--border`), label faint — same emotional posture as DayRail `missed` (UX spec DayRail table).
- Toggle labels: neutral (“30 / 60 / 90 days”), no motivational friction copy.

### Expected file targets

| Action | Path |
|--------|------|
| NEW | `src/app/calendar/page.tsx` |
| NEW | `src/features/calendar/use-calendar-grid.ts` |
| NEW | `src/components/audiblytics/CalendarDayCell.tsx` (name may vary; keep under `components/audiblytics/`) |
| UPDATE | `src/components/audiblytics/TopNav.tsx` (or equivalent) — add `/calendar` link if missing |
| READ | `src/features/calendar/evaluate-completion.ts` |
| READ | `src/lib/day-counter/format-utc-date.ts`, `src/lib/storage/use-local-storage.ts` |

### Common failure modes to avoid

- Duplicating FR53 completion rules outside `evaluate-completion` → drift vs streak/DayRail.
- Using **local** calendar dates for cell keys → DST bugs (NFR13).
- Implementing Story 4.5 archive panel early → scope creep; grid-only when no `day` param.
- Heavy re-renders scanning 90 days on every keystroke elsewhere → violates NFR6.

### Latest technical specifics

- Web research skipped for this run (pinned stack already fixed in architecture — Next.js App Router, Tailwind v4 tokens, no new deps).

### Project context reference

- No `project-context.md` present in repo; rely on architecture + epics + this file.

## Dev Agent Record

### Agent Model Used

GPT-5.2

### Debug Log References

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created

### File List

- `_bmad-output/implementation-artifacts/4-4-calendar-route-30-60-90-day-toggle-grid-with-honest-empty-cells.md`
