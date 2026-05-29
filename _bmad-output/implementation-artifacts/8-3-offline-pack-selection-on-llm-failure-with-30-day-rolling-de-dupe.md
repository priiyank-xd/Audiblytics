# Story 8.3: Offline-Pack Selection on LLM Failure with 30-Day Rolling De-Dupe

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Priyank,
I want the Today screen to optionally fall back to the offline pack when LLM calls fail (or when I explicitly choose "Use Offline Pack"), with the same paragraph never resurfacing within a 30-day window,
So that I can complete my daily ritual even when Gemini is down or quota-exhausted, without the same content appearing repeatedly.

## Acceptance Criteria

> Sourced from `epics.md § Story 8.3` (lines 1647–1667). Numbered for task traceability.

1. **AC1 — Selector + persist `lastSurfacedAt`** — Given an LLM generation has failed and the user invokes offline-pack fallback (the **`[Use Offline Pack]`** affordance is added in **Story 8.4**; this story owns the callable selector and Today-screen plumbing), when that action runs, then **`src/features/offline-pack/select-from-offline-pack.ts`** selects one row from Dexie **`offlinePack`** whose **`lastSurfacedAt`** is **`null`** OR **strictly older than 30 days before “now”** (UTC-aware `Date` math), per **FR62**, **FR63**, **AR10** (`lastSurfacedAt` index). After selection, that row’s **`lastSurfacedAt`** is **updated to the current UTC ISO datetime** in the same logical operation (prefer **single Dexie `transaction`** wrapping read candidate set + `update`).

2. **AC2 — Render in paragraph zone** — Given AC1 succeeds, when the UI updates, then the chosen **`paragraph`** and **`hardWords`** render through **`<ParagraphHero>`** and the hard-words list per **Epic 1 Stories 1.10 / 1.11** (same props/shape as LLM success path — reuse existing paragraph result types where possible; map offline row → **`ParagraphResult`** or the canonical UI contract defined in **`lib/llm`** / **`paragraph.schema`**).

3. **AC3 — Wrap-around when pool is empty** — Given the pack is non-empty but **every** row has **`lastSurfacedAt`** within the **last 30 days** (includes **n = 1** pack edge case), when the selector runs, then it **selects the row with the minimum `lastSurfacedAt`** (oldest surfaced — deterministic tie-break if equal), updates that row’s **`lastSurfacedAt`** to now, and proceeds as AC2.

4. **AC4 — Completion links `usedOfflinePack`** — Given the user completes the daily ritual for **today’s UTC date** after displaying offline-pack content (marks read-it / satisfies completion rules per **Story 4.2**), when completion is recorded, then **`audiblytics.completions[todayUtc]`** includes **`usedOfflinePack: true`** (extend existing completions write path — **`useLocalStorage`** + Zod schema per **architecture § localStorage**), per **FR59** (consumers: **Story 8.5** badge).

## Tasks / Subtasks

- [x] **Task 0 — Preconditions** (AC: all)
  - [x] 0.1 Confirm **`offlinePack`** store and indexes: **`++id, theme, persona, lastSurfacedAt`** in **`src/lib/storage/db.ts`** (architecture).
  - [x] 0.2 Confirm **`offline-pack.schema.ts`** row shape matches Story **8.2** loader (**`paragraph`**, **`hardWords`**, **`theme`**, **`persona`**, **`generatedAt`**, **`lastSurfacedAt`** nullable).
  - [x] 0.3 Read **`evaluate-completion.ts`** / **`use-mark-read-it.ts`** (or current completion writers) to add **`usedOfflinePack`** without breaking **`hasReadIt`** / **`hasRecording`** merges.

- [x] **Task 1 — `select-from-offline-pack.ts`** (AC: 1, 3)
  - [x] 1.1 Export **`selectFromOfflinePack(now?: Date): Promise<Result<OfflinePackSelection, OfflinePackError>>`** (Result-shaped, `empty_pack` for empty pack).
  - [x] 1.2 Defines **`ROLLING_WINDOW_MS = 30 * 24 * 60 * 60 * 1000`** (rolling 30×24h from `now`).
  - [x] 1.3 Eligible set matches: `lastSurfacedAt == null` OR `lastSurfacedAtMs < cutoffMs` (strictly older).
  - [x] 1.4 Primary pick chooses an eligible row uniformly using crypto `getRandomValues` (rejection sampling) and falls back to `Math.random`.
  - [x] 1.5 Fallback pick chooses the row with the minimum `lastSurfacedAt`, treating `null` as oldest, with deterministic id tie-break.
  - [x] 1.6 Empty pack returns `{ ok: false, error: { kind: 'empty_pack', ... } }`.
  - [x] 1.7 Uses a single Dexie `transaction('rw', db.offlinePack, ...)`, re-reads selected row inside the transaction, then updates `lastSurfacedAt` to `now`.

- [x] **Task 2 — Today / paragraph zone integration** (AC: 2)
  - [x] 2.1 Locate Today route state that drives **`<ParagraphHero>`** / **`InlineErrorSurface`** (architecture: error replaces paragraph zone).
  - [x] 2.2 Add handler **`applyOfflinePackParagraph()`** (name flexible) invoked from: (a) future **8.4** **`[Use Offline Pack]`** callback, and optionally (b) internal test harness — sets local “current paragraph” state from selector result, **clears** LLM error state, does **not** call LLM.
  - [x] 2.3 Ensure **hard-words list** receives the same structure as LLM path (**`HardWordRow`** loop).

- [x] **Task 3 — `usedOfflinePack` on completion** (AC: 4)
  - [x] 3.1 Extend **`audiblytics.completions`** Zod schema (if not already) so each day includes **`usedOfflinePack: boolean`** default **`false`**.
  - [x] 3.2 When user completes day **after** session used offline pack, set **`usedOfflinePack: true`** for **that UTC date key** — merge with existing **`hasReadIt`** / **`hasRecording`** flags (do not wipe other fields).
  - [x] 3.3 Thread a **session-level flag** (e.g. **`didUseOfflinePackThisSession`**) set when offline paragraph applied, cleared on fresh LLM success for same day if such reset exists — simplest: set flag when applying offline pack; completion writer reads flag OR infers from paragraph source — **prefer explicit boolean state** in Today container to avoid ambiguity.

- [x] **Task 4 — Verification** (AC: all)
  - [x] 4.1 With **≥2** pack rows and manipulated **`lastSurfacedAt`**, confirm eligible subset selection and DB update in DevTools.
  - [x] 4.2 **Single-row pack:** force both conditions — recently surfaced → wrap-around picks same row, updates timestamp.
  - [x] 4.3 Confirm **`completions[YYYY-MM-DD].usedOfflinePack === true`** after read-it (or equivalent completion) when offline path used.

## Dev Notes

### Architecture compliance

- **New module path:** **`src/features/offline-pack/select-from-offline-pack.ts`** (architecture tree **lines ~1072–1075**).
- **Import boundaries:** Selector imports **`db`**, **`offline-pack` Zod types**, **`lib/`** utilities only — **no** import of other **`features/*`** except through composition at **`app/`** / Today container if needed.
- **Dexie:** **`lastSurfacedAt`** indexed — filter eligible set via **`where('lastSurfacedAt').below(cutoff)`** plus **`or`** / **`filter`** for **`null`** OR load-and-filter in memory if Dexie query composition is awkward — **correctness > micro-optimization** for ~1k rows.
- **Result types:** Match **`lib/llm`** **`Result<T,E>`** discriminant (**`ok`** boolean).

### Cross-story coordination

- **Story 8.4** adds **`[Use Offline Pack]`** to **`InlineErrorSurface`**. This story must expose a **stable, testable API** (`selectFromOfflinePack` + Today wiring) so **8.4** only connects button → handler.
- **Story 8.5** renders **`OfflineBadge`** from **`completions[..].usedOfflinePack`** — do not render badge here; only persist the flag.

### UX

- **UX Flow J4** (ux-design-specification **§ Flow 4**): offline path replaces error with paragraph; **no modal**.
- After offline paragraph shows, user should **not** see the LLM error surface for that session unless they explicitly retry LLM.

### Previous story intelligence (8.2)

- **`pack-loader.ts`** **clears** table before insert — **`lastSurfacedAt`** from JSON normalized for storage; **8.3** owns **all** runtime updates to **`lastSurfacedAt`** on selection.
- **`Download Pack`** leaves **`offlinePack`** ready for **8.3** selector.

### Project context reference

- No **`project-context.md`** found in repo at create-story time — rely on **`architecture.md`**, **`epics.md`**, **`ux-design-specification.md`**, and **Story 8.2** file.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Story 8.3]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — Dexie `offlinePack`, `audiblytics.completions`, features tree]
- [Source: `_bmad-output/planning-artifacts/prd.md` — FR62, FR63, FR59]
- [Source: `_bmad-output/implementation-artifacts/8-2-download-pack-settings-action-load-pack-into-indexeddb.md`]

## Dev Agent Record

### Agent Model Used

Composer (auto-sprint impl)

### Debug Log References

### Completion Notes List

- `select-from-offline-pack.ts` + unit tests (Task 1)
- Today: `applyOfflinePackParagraph`, `resolveTodayDisplayParagraph`, session `usedOfflinePackThisSession`
- `mergeMarkReadItCompletion` + tests; `useMarkReadIt` threads offline session flag
- `handleApplyOfflinePack` in TodayRouteBody ready for Story 8.4 button wire-up

### File List

- `src/features/offline-pack/select-from-offline-pack.ts`
- `src/features/offline-pack/select-from-offline-pack.test.ts`
- `src/features/offline-pack/resolve-today-display-paragraph.ts`
- `src/features/offline-pack/resolve-today-display-paragraph.test.ts`
- `src/features/calendar/merge-mark-read-it-completion.ts`
- `src/features/calendar/merge-mark-read-it-completion.test.ts`
- `src/features/calendar/use-mark-read-it.ts`
- `src/app/page.tsx`

---

**Story completion status:** Ultimate context engine analysis completed — comprehensive developer guide created.
