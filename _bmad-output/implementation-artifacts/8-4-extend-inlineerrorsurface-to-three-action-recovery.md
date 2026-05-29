# Story 8.4: Extend InlineErrorSurface to Three-Action Recovery

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Priyank,
I want the existing inline error surface from Epic 1 Story 1.12 to gain a third action `[Use Offline Pack]` when (and only when) the offline pack is loaded into IndexedDB,
So that the full PRD §J4 recovery surface — Retry / Open Settings / Use Offline Pack — is in place once Epic 8 is complete.

## Acceptance Criteria

> Sourced from `_bmad-output/planning-artifacts/epics.md` — Story 8.4 (lines 1671–1692). Numbered for task traceability.

1. **AC1 — Conditional third action (offline pack present)** — Given an LLM generation fails and `<InlineErrorSurface>` renders, when the implementation checks for offline-pack presence (**count of rows in Dexie `offlinePack` > 0**), then a third outline/secondary button **`[Use Offline Pack]`** is visible alongside **`[Retry]`** and **`[Open Settings]`** (per **FR64**, **UX-DR24** `with-offline-pack` variant). When **no** rows exist, **only** the two original buttons render (**UX-DR24** `without-offline-pack` variant).

2. **AC2 — Use Offline Pack applies selector + replaces error** — Given AC1 shows the third button, when the user taps **`[Use Offline Pack]`**, then **`selectFromOfflinePack`** from **Story 8.3** (`src/features/offline-pack/select-from-offline-pack.ts`) runs, on success the **paragraph zone** shows the offline **`ParagraphHero`** path (same as LLM success wiring per **8.3**), **LLM error state clears**, and **`InlineErrorSurface` unmounts** (recovered state per UX spec). **Do not** trigger a new LLM call.

3. **AC3 — Completion / badge data path (Story 8.5)** — Given AC2 succeeds, when the user later completes the daily ritual for today per **Story 4.2** / **8.3**, then **`audiblytics.completions[todayUtc].usedOfflinePack === true`** so **Story 8.5** can render **`OfflineBadge`** (8.4 must invoke the same **8.3** “session used offline pack” / **`applyOfflinePackParagraph`** path that sets the session flag the completion writer reads — **do not** render the badge in this story).

4. **AC4 — Retry regression guard** — Given the surface is rendered, when the user taps **`[Retry]`**, then behavior matches **Epic 1 Story 1.12**: user-intent retry (re-invoke generate), Retry shows mini-spinner while others disabled, no stacked errors, **no regression** because of the third button (third button disabled during retry per UX **`retrying`** state).

## Tasks / Subtasks

- [ ] **Task 0 — Read UPDATE targets** (AC: all)
  - [ ] 0.1 Read **`src/components/audiblytics/InlineErrorSurface.tsx`** — current props (`error`, `onRetry`, `onOpenSettings`), brick/ink-soft layout, `role="alert"`, button group.
  - [ ] 0.2 Read Today route (**`src/app/page.tsx`** or architecture-equivalent) + **`ParagraphHero`** — where error replaces paragraph zone and callbacks originate.
  - [ ] 0.3 Read **`src/features/offline-pack/select-from-offline-pack.ts`** + Today handler from **8.3** (`applyOfflinePackParagraph` or equivalent) — **wire only**; do not reimplement selector.

- [ ] **Task 1 — Extend `InlineErrorSurface`** (AC: 1, 4)
  - [ ] 1.1 Add props (exact names flexible): e.g. **`hasOfflinePack: boolean`** (parent computes via **`db.offlinePack.count()`** / **`useLiveQuery`**) and **`onUseOfflinePack?: () => void | Promise<void>`** — third button omitted when `hasOfflinePack === false` OR callback undefined.
  - [ ] 1.2 Render **three** buttons in DOM order: **`[Retry]`**, **`[Open Settings]`**, **`[Use Offline Pack]`** when variant is `with-offline-pack` (match **UX spec** anatomy — order may follow UX: Retry, Open Settings, Use Offline Pack as in `_bmad-output/planning-artifacts/ux-design-specification.md` § `InlineErrorSurface`).
  - [ ] 1.3 **`retrying` state:** disable **`[Open Settings]`** and **`[Use Offline Pack]`** (and Retry shows spinner) — same rules as **1.12** plus third button.
  - [ ] 1.4 Optional: **`usingOfflinePack`** transient state — disable all three + mini-spinner on **`[Use Offline Pack]`** while **`selectFromOfflinePack`** runs (prevents double-submit); on **`empty_pack`** / error result from selector, **keep** error surface and surface message or rely on existing error copy (align with **8.3**).

- [ ] **Task 2 — Wire Today / feature container** (AC: 1–3)
  - [ ] 2.1 Subscribe or query **`offlinePack`** row count **reactively** (Dexie **`useLiveQuery`** from `dexie-react-hooks` if already in stack per architecture — else poll on mount + storage event if acceptable; **prefer reactive count** so Download Pack in Settings updates Today without reload).
  - [ ] 2.2 Pass **`hasOfflinePack`** and **`onUseOfflinePack`** into **`InlineErrorSurface`**. Implement **`onUseOfflinePack`** by calling the **8.3** handler that: runs **`selectFromOfflinePack()`**, maps result to **`ParagraphResult`** / paragraph state, clears **`LlmError`** state, sets **session flag** for **`usedOfflinePack`** on completion per **8.3**.
  - [ ] 2.3 Confirm **no modal** — paragraph replaces error inline (**UX Flow J4**).

- [ ] **Task 3 — Verification** (AC: all)
  - [ ] 3.1 **No pack:** empty **`offlinePack`** → **two** buttons only; grep/visual check third absent.
  - [ ] 3.2 **With pack:** three buttons; **`[Use Offline Pack]`** yields paragraph + hard words; error surface gone.
  - [ ] 3.3 **Retry:** fails LLM → retry → still three buttons when pack loaded; behavior matches **1.12**.
  - [ ] 3.4 After offline paragraph + complete ritual → **`completions[today].usedOfflinePack`** (manual DevTools / localStorage inspect).

## Dev Notes

### Architecture compliance

- **UPDATE (not greenfield):** **`src/components/audiblytics/InlineErrorSurface.tsx`** — add third action + props; preserve **`variant="storage"`** usage from **8.2** Settings path if the same component handles storage errors (**FR42**) — do not break two-action layout for non-LLM variants unless UX specifies otherwise.
- **Offline pack feature:** **`src/features/offline-pack/select-from-offline-pack.ts`** — import only for invocation from Today handler; **no** duplicate selection logic in **`InlineErrorSurface`** (keep composite dumb/presentational).
- **Dexie:** **`db.offlinePack`** — presence = **`count() > 0`** per epic; index **`lastSurfacedAt`** irrelevant for this check.

### UX

- **`InlineErrorSurface`** variants **`with-offline-pack` / `without-offline-pack`** — [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` § `InlineErrorSurface` (~1619–1647)]
- **PRD §J4 / FR64** — three recovery actions when pack loaded — [Source: `_bmad-output/planning-artifacts/prd.md` FR64]

### Cross-story coordination

- **Story 8.3** owns **`selectFromOfflinePack`**, **`applyOfflinePackParagraph`** (or equivalent), **`usedOfflinePack`** on completion. **8.4** is **UI wiring + conditional visibility** only.
- **Story 8.5** owns **`OfflineBadge`** rendering — **out of scope** for **8.4** except ensuring **8.3** completion flag path remains reachable after button click.

### Previous story intelligence (8.3)

- **`[Use Offline Pack]`** callback path must mirror **8.3** Task **2.2** — single handler used from **8.4** button.
- Selector **`empty_pack`** — surface stays or inline message; product decision: prefer **keeping `InlineErrorSurface`** with updated copy vs toast (**none** per NFR).

### Git intelligence

- No git repository detected at create-story time — no commit-level patterns to cite.

### Project context reference

- **`project-context.md`** not present in repo — rely on **`architecture.md`**, **`epics.md`**, **`ux-design-specification.md`**, stories **1.12**, **8.2**, **8.3**.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 8, Story 8.4]
- [Source: `_bmad-output/planning-artifacts/prd.md` — FR64, Flow J4]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` — `InlineErrorSurface`, UX-DR24]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — components tree, `features/offline-pack/`]
- [Source: `_bmad-output/implementation-artifacts/1-12-inline-error-surface-with-two-action-recovery.md`]
- [Source: `_bmad-output/implementation-artifacts/8-3-offline-pack-selection-on-llm-failure-with-30-day-rolling-de-dupe.md`]

## Dev Agent Record

### Agent Model Used

(Create-story workflow — comprehensive context pass; web research skipped per parent request.)

### Debug Log References

### Completion Notes List

### File List

---

**Story completion status:** Ultimate context engine analysis completed — comprehensive developer guide created.
