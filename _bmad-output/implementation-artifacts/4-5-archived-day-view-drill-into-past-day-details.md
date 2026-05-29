# Story 4.5: Archived Day View — Drill into Past Day Details

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Priyank,
I want to tap any completed day-cell in the calendar or DayRail and see that day's archived paragraph excerpt, words saved, and recordings made,
so that I can revisit any past session as a record of what I read and learned.

## Acceptance Criteria

1. **Given** the user is on `/calendar` and taps a **completed** day-cell in the **calendar grid**  
   **When** the click fires  
   **Then** navigation updates to `/calendar?day=N` where `N` is the cell's UTC calendar date as **`YYYY-MM-DD`** (per FR56, epics; DST-safe — NFR13)  
   **And** the **archived day detail panel** renders **below** the existing grid (grid stays visible; panel is secondary content)  
   [Source: `_bmad-output/planning-artifacts/epics.md` § Story 4.5; `_bmad-output/planning-artifacts/prd.md` FR56; `_bmad-output/planning-artifacts/architecture.md` routing + `use-archived-day.ts`]

2. **Given** the archived day panel is shown for a selected `day`  
   **When** it resolves local data  
   **Then** it displays **theme + persona + first ~30 words** excerpt from `paragraphCache` for that UTC day (truncate on word boundary; ellipsis if needed)  
   **And** the **count of words saved that UTC day** — join `collection` rows whose `savedAt` falls on `N` in **UTC** (same date semantics as day-counter; do not use naive local-midnight splits for the key)  
   **And** a **list of recordings** made that UTC day with **inline playback**, reusing **`VoiceJournalList`** row presentation / playback behavior (do not fork a second player pattern)  
   [Source: `_bmad-output/planning-artifacts/epics.md` § Story 4.5; `_bmad-output/planning-artifacts/architecture.md` Dexie indexes + `VoiceJournalList.tsx`; Epic 2/3 dependencies]

3. **Given** the user interacts with **`DayRail`** cells  
   **When** they tap a **`future`** or **`today`** cell  
   **Then** **no navigation** occurs (non-interactive or no-op handler — UX-DR9)  
   [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` § DayRail interaction]

4. **Given** the user taps a **`missed`** day-cell (calendar or DayRail, wherever exposed)  
   **When** the click fires  
   **Then** **no navigation** **or** if the UX wires an optional handler, the archived panel shows **only** *"No session on this day."* in **italic Garamond** (body serif token — matches UX-DR34 posture), **no** shame language  
   [Source: `_bmad-output/planning-artifacts/epics.md` § Story 4.5; UX-DR34]

5. **Given** `?day=` is **absent**, empty, or invalid (not `YYYY-MM-DD`)  
   **When** `/calendar` renders  
   **Then** **no** archived panel mounts — behavior stays aligned with Story 4.4 grid-only mode  
   [Source: `_bmad-output/planning-artifacts/epics.md` Story 4.4 + 4.5; `_bmad-output/planning-artifacts/architecture.md` — only `/calendar?day=N` query param app-wide]

6. **Given** the archived view reads IndexedDB + local state  
   **When** the panel loads  
   **Then** all reads stay **local** (Dexie `useLiveQuery` / synchronous hooks); **no** network calls; target **under 100ms** felt latency consistent with NFR6 for calendar surfaces  
   [Source: `_bmad-output/planning-artifacts/prd.md` NFR6; architecture reactive bindings]

## Tasks / Subtasks

- [ ] **Task 1 — `use-archived-day.ts` (feature hook)** (AC: 2, 6)  
  - [ ] 1.1 Add `src/features/calendar/use-archived-day.ts` per architecture tree — export a hook taking **`utcDate: string | null`** (`YYYY-MM-DD` or `null` when no selection).  
  - [ ] 1.2 **Paragraph:** query `paragraphCache` for the row whose `generatedAt` maps to **`utcDate`** via **`formatUtcDate`** (or equivalent single helper from `lib/day-counter`) — **one** paragraph per day for MVP; if multiple rows ever exist, prefer the latest `generatedAt` for that UTC day (document tie-break in code comment).  
  - [ ] 1.3 **Collection count:** query/filter `collection` where `savedAt` normalizes to **`utcDate`** in UTC (use existing date helpers; align with how other features stamp `savedAt`).  
  - [ ] 1.4 **Recordings:** query `recordings` filtered by **`dayOfUse === utcDate`** **or** `formatUtcDate(recordingDate) === utcDate` — use whichever field is authoritative in implemented schema (`dayOfUse` is indexed per architecture; prefer indexed path for performance). Sort like `use-recordings` / Voice Journal list (recency).  
  - [ ] 1.5 Subscribe with **`useLiveQuery`** so paragraph saves / new recordings update the panel without reload.

- [ ] **Task 2 — Calendar page: URL + panel composition** (AC: 1, 5)  
  - [ ] 2.1 Update **`src/app/calendar/page.tsx`**: read `searchParams.day` (Next.js App Router `useSearchParams` or page props pattern consistent with repo). Parse **strict** `YYYY-MM-DD`; invalid → treat as **no selection**.  
  - [ ] 2.2 When valid `day` **and** the corresponding grid cell is **completed** (via **`evaluateCompletion`** for that date — do not show archive for incomplete days even if URL is hand-edited): render archived panel **below** grid.  
  - [ ] 2.3 When `day` present but day **not** completed: show empty posture per AC4 (italic Garamond single line) — **no** fabricated session data.  
  - [ ] 2.4 Implement **grid cell click** → `router.push(\`/calendar?day=${encodeURIComponent(date)}\`)` (or `<Link>` with `scroll={false}`) for **completed** cells only.

- [ ] **Task 3 — Presentational `ArchivedDayPanel`** (AC: 2, 4, 6)  
  - [ ] 3.1 Add `src/components/audiblytics/ArchivedDayPanel.tsx` (name flexible but lives under `components/audiblytics/`): theme/persona labels, excerpt block (~30 words), stat line for words saved, recordings section.  
  - [ ] 3.2 Reuse list row from **`VoiceJournalList`** patterns — extract a row subcomponent if needed **without** duplicating audio element logic (DRY with voice-journal feature).  
  - [ ] 3.3 **A11y:** panel is a **region** with `aria-labelledby`; recordings list items keyboard-focusable like Voice Journal.

- [ ] **Task 4 — DayRail navigation** (AC: 3)  
  - [ ] 4.1 Update **`DayRail.tsx`**: on **`completed`** cell click → navigate to `/calendar?day=N` for that cell's UTC date (UX spec: completed cells deep-link).  
  - [ ] 4.2 **`future` / `today`:** pointer-events none or onClick no-op; preserve existing visual hierarchy.

- [ ] **Task 5 — Verification** (AC: 1–6)  
  - [ ] 5.1 Manual: complete a day with paragraph + read-it → tap cell → URL + panel show excerpt + counts.  
  - [ ] 5.2 Manual: hand-edit URL to a **missed** day → italic empty copy; **no** errors in console.  
  - [ ] 5.3 Manual: DayRail future/today cells do nothing on click.

## Dev Notes

### Previous story intelligence (4.4)

- Story **4.4** intentionally left **`?day=`** unset behavior as **grid-only**. This story **owns** all archive UI when `day` is set. Do not regress 4.4’s “no panel without navigation contract.”  
- **`evaluate-completion.ts`** remains the **only** source of “completed” for deciding whether a cell is tappable and whether archive data is appropriate — **never** re-derive FR53 rules in UI.  
- URL contract: **`/calendar?day=N`** is the **only** app-wide query string — do not add others ([Source: `architecture.md` § Routing model]).

### Architecture & layering

- **`src/features/calendar/use-archived-day.ts`** — **NEW** (listed in architecture file tree for FR56).  
- **`src/app/calendar/page.tsx`** — **UPDATE** to compose hook + panel.  
- **`lib/` MUST NOT import `features/`** — archived-day hook stays in `features/calendar`. Dexie access goes through existing `lib/storage/db` patterns.  
- **Imports:** `app` → `components` / `features` / `lib` only (architecture boundaries).

### Data model guardrails

| Store | Field | Use |
|-------|-------|-----|
| `paragraphCache` | `generatedAt`, `theme`, `persona`, paragraph body | Excerpt + meta |
| `collection` | `savedAt` | Filter to UTC day `N` |
| `recordings` | `dayOfUse`, `recordingDate` | Same-day list + playback |

Validate reads with Zod-inferred types from `lib/schemas` on write paths elsewhere; hook should tolerate empty tables gracefully.

### UX guardrails

- **No shame** for missed days — grey honesty only (FR58); archived empty copy is the **single** italic sentence per epics.  
- Typography: excerpt + archive headings follow **cream / ink / forest** discipline; empty state uses **Garamond** italic per spec reference.

### Expected file targets

| Action | Path |
|--------|------|
| NEW | `src/features/calendar/use-archived-day.ts` |
| NEW | `src/components/audiblytics/ArchivedDayPanel.tsx` |
| UPDATE | `src/app/calendar/page.tsx` |
| UPDATE | `src/components/audiblytics/DayRail.tsx` |
| UPDATE | `src/components/audiblytics/CalendarDayCell.tsx` (or equivalent grid cell from 4.4) — wire click |
| READ | `src/features/calendar/evaluate-completion.ts` |
| READ | `src/components/audiblytics/VoiceJournalList.tsx` |
| READ | `src/lib/day-counter/format-utc-date.ts` |

### Common failure modes to avoid

- Parsing `day` in local timezone → **broken DST** (NFR13) — always **`YYYY-MM-DD`** UTC semantic from day-counter helpers.  
- Showing archive **without** `evaluateCompletion === complete` for that date → violates FR53 honesty.  
- Duplicating Voice Journal playback markup → drift with Epic 3 bugfixes.  
- Adding **any** second query param to URLs → violates architecture routing invariant.

### Latest technical specifics

- Web research skipped per project directive; stack pinned in architecture (Next.js App Router, Dexie 4.4.x, dexie-react-hooks 4.2.x).

### Project context reference

- No `project-context.md` found in repo — rely on architecture, PRD FR56, UX DayRail §interaction, and this file.

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Debug Log References

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created

### File List

- `_bmad-output/implementation-artifacts/4-5-archived-day-view-drill-into-past-day-details.md`
