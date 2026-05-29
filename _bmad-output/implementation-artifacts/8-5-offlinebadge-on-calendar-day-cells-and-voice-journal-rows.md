# Story 8.5: OfflineBadge on Calendar Day-Cells and Voice Journal Rows

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Priyank,
I want any session that used the offline pack to display a small badge on its calendar day-cell (and optionally on its Voice Journal row),
So that future-me can see at a glance which sessions ran on fresh LLM generation versus offline fallback.

## Acceptance Criteria

> Sourced from `_bmad-output/planning-artifacts/epics.md` — Story 8.5 (lines 1695–1714). Numbered for task traceability.

1. **AC1 — DayRail + `/calendar` grid** — Given **`audiblytics.completions[date].usedOfflinePack === true`** for a UTC date key **`YYYY-MM-DD`**, when that date’s day-cell renders in **`<DayRail>`** or the **`/calendar`** grid (whichever components implement **Story 4.4** / **UX-DR9** cell states), then a small **`<OfflineBadge>`** (**8×8px** icon overlay in **`--ink-faint`**, per **UX-DR26**) appears in the **corner** of the cell (per **FR59**). Hovering/focusing the cell (or the badge, per UX — prefer **tooltip on the interactive cell** for completed days) shows copy **"This day used the offline pack."** The cell’s visual state matches **`completed-offline`**: **solid forest dot + badge overlay** (not plain **`completed`** without badge), per **UX spec § DayRail** states.

2. **AC2 — Voice Journal list (optional)** — Given the same completion flag for a date, when **`<VoiceJournalList>`** (Story **3.4**) renders a row tied to that calendar day / **`dayOfUse`**, then **`OfflineBadge`** **may** appear **next to the date metadata** (epics: optional; **UX-DR26** allows Voice Journal placement — if implemented, reuse the **same** `<OfflineBadge>` component, do not fork a second icon).

3. **AC3 — Color-blind signal** — Given the badge is visible, when viewed under **protanopia / deuteranopia** simulation (design QA), the indicator remains **distinguishable by shape/icon** — color reinforces but is **not** the only signal (per **UX-DR40**). Prefer a **simple geometric / pack glyph** (e.g. small square or stacked-lines SVG), not a hue-only dot.

## Tasks / Subtasks

- [ ] **Task 0 — Read UPDATE targets** (AC: all)
  - [ ] 0.1 Read **`src/components/audiblytics/DayRail.tsx`** — cell states, how **`completed`** vs **`today`** vs **`missed`** are chosen; where **`completions`** / **`daysOfUse`** are read (likely **`useLocalStorage`** + calendar feature hooks).
  - [ ] 0.2 Read **`src/app/calendar/page.tsx`** + **`src/features/calendar/use-calendar-grid.ts`** (or current grid composer) — ensure **`completed-offline`** is represented for grid cells, not only DayRail.
  - [ ] 0.3 Read **`src/components/audiblytics/VoiceJournalList.tsx`** (if present) — date metadata column; only add badge if low-conflict.
  - [ ] 0.4 Read **`audiblytics.completions`** Zod schema + writers (**`use-mark-read-it`**, **`evaluate-completion`**, **`use-save-recording`**) from **Stories 4.2 / 8.3** — confirm **`usedOfflinePack`** is read as **`boolean`** with safe default **`false`** when key missing (older localStorage blobs).

- [ ] **Task 1 — `OfflineBadge` component** (AC: 1, 3)
  - [ ] 1.1 Add **`src/components/audiblytics/OfflineBadge.tsx`** — **named export** **`OfflineBadge`**, **`OfflineBadgeProps`** optional **`className`** for positioning wrapper; fixed **8×8px** visual box using **semantic tokens** only (**`text-ink-faint`** / **`bg-*` via tokens** — **no** hex / arbitrary color literals per architecture § tokens).
  - [ ] 1.2 **`aria-label="Offline pack session"`** (per UX § OfflineBadge). Compose **shadcn `Tooltip`** from **`src/components/ui/tooltip.tsx`** so keyboard/focus users get the same string as hover (**"This day used the offline pack."**).
  - [ ] 1.3 Implement icon as **inline SVG** (or lucide if already in stack — match project convention) with **non-color-only** distinction (stroke/shape).

- [ ] **Task 2 — Wire DayRail + calendar grid** (AC: 1)
  - [ ] 2.1 Derive per-date **`usedOfflinePack`** from **`completions[utcDate]`** at the same boundary other cell states use UTC keys (**architecture § date/time**).
  - [ ] 2.2 When **`usedOfflinePack === true`** **and** the cell is **completed** (paragraph + read-it/recording per **FR53** — badge only on **completed** days, not missed/future), set state variant to **`completed-offline`** and render **`<OfflineBadge />`** absolutely positioned in cell corner (**`relative` parent / `absolute` child** pattern).
  - [ ] 2.3 Update screen-reader copy if needed: e.g. **"Day N, completed, offline pack"** so SR users get parity with tooltip (extend **UX-DR9** SR pattern).

- [ ] **Task 3 — Optional Voice Journal row** (AC: 2)
  - [ ] 3.1 If **`VoiceJournalList`** rows carry **`dayOfUse`** as **`YYYY-MM-DD`**, map **`completions[dayOfUse]?.usedOfflinePack`** → optional **`OfflineBadge`** beside date text.
  - [ ] 3.2 If row ↔ completion correlation is ambiguous (multiple recordings/day), prefer **badge once per row** when **that row’s `dayOfUse`** matches a flagged completion — document assumption in Dev Agent Record if edge case.

- [ ] **Task 4 — Dev gallery + verification** (AC: all)
  - [ ] 4.1 Add **`OfflineBadge`** (present/absent) and a **`DayRail`** / mock cell **`completed-offline`** preview to **`src/app/_dev/components/page.tsx`** when gallery exists (**architecture** gated **`NEXT_PUBLIC_DEV_GALLERY`**).
  - [ ] 4.2 Manual: complete ritual via **offline pack** path (**8.3 / 8.4**) → **`completions[today].usedOfflinePack === true`** → badge on **Today** cell after completion (and on **`/calendar`** for that date).
  - [ ] 4.3 **Regression:** LLM-generated day **without** offline flag → **no** badge; **`completed`** styling unchanged.

## Dev Notes

### Architecture compliance

- **NEW:** **`src/components/audiblytics/OfflineBadge.tsx`** — UX composite; lives under **`components/audiblytics/`** per architecture tree (**~1012–1031**). *(Architecture line ~1028 cites FR56–FR57 next to `OfflineBadge`; **FR59** is the authoritative badge requirement — follow epics/PRD.)*
- **UPDATE:** **`DayRail.tsx`**, **`/calendar`** UI module(s), optionally **`VoiceJournalList.tsx`** — extend state derivation only; **do not** write **`localStorage`** directly from these components (**`useLocalStorage`** hook only).
- **Data source:** **`audiblytics.completions`** — **`Record<string, { hasReadIt; hasRecording; usedOfflinePack }>`** per architecture **§ localStorage** (~623–624). Badge is **read-only** consumer of **`usedOfflinePack`** (**Story 8.3** owns writes).

### UX

- **`DayRail` states** — **`completed-offline`** definition (**UX spec ~1205–1207**): forest dot + **`OfflineBadge`** overlay.
- **`OfflineBadge` anatomy & a11y** — **UX spec ~1699–1707** (8×8px, **`--ink-faint`**, tooltip string, **`aria-label`**).
- **UX-DR40** — shape/icon must survive color-blind simulation; verify in `_dev/components` or browser overlay.

### Cross-story coordination

- **8.3** persists **`usedOfflinePack`** on completion; **8.4** ensures offline paragraph path reaches completion writer. This story **never** sets the flag — **display only**.
- **4.3 / 4.4** calendar + DayRail consumption — keep **`FR53`** completion rules aligned: badge appears only when day is **actually completed** **and** offline pack was used.

### Previous story intelligence (8.4)

- **8.4 AC3** explicitly requires completion path after **`[Use Offline Pack]`** so **`completions[todayUtc].usedOfflinePack`** is available — if badge never appears after offline flow, fix **consumer read** first (wrong UTC key, stale hook snapshot, or completion merge bug), not badge SVG.

### Git intelligence

- No git repository detected at create-story time — no commit-level patterns to cite.

### Project context reference

- No **`project-context.md`** found in repo — rely on **`architecture.md`**, **`epics.md`**, **`ux-design-specification.md`**, stories **8.3**, **8.4**, **4.2**, **4.4**.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 8, Story 8.5]
- [Source: `_bmad-output/planning-artifacts/prd.md` — FR59]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — `audiblytics.completions`, component tree]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` — UX-DR9 DayRail, UX-DR26 OfflineBadge, UX-DR40]
- [Source: `_bmad-output/implementation-artifacts/8-3-offline-pack-selection-on-llm-failure-with-30-day-rolling-de-dupe.md`]
- [Source: `_bmad-output/implementation-artifacts/8-4-extend-inlineerrorsurface-to-three-action-recovery.md`]

## Dev Agent Record

### Agent Model Used

(Create-story workflow — comprehensive context pass; web research skipped per parent request.)

### Debug Log References

### Completion Notes List

### File List

---

**Story completion status:** Ultimate context engine analysis completed — comprehensive developer guide created.
