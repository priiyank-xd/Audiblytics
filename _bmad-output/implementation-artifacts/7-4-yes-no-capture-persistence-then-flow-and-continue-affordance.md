# Story 7.4: Yes/No Capture, Persistence-Then-Flow, and Continue Affordance

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Priyank,
I want my Yes/No tap to persist to localStorage BEFORE any celebratory copy renders, then show outcome copy and a ghost continue button after 3 seconds,
so that even a force-quit captures my self-report and the celebration feels earned, not insisted upon.

## Acceptance Criteria

> Canonical storage model: **`audiblytics.day14State`** as `{ fired: boolean; result: 'yes' | 'no' | null }` per **`day14StateSchema`** (Story 1.4). UX prose that names legacy keys (`day14Result`, `day14PromptFired`, `day14_outcome`) is **deprecated** — **`audiblytics.day14State`** + **`useLocalStorage`** per AR11–AR12 is authoritative. [Source: `epics.md` FR aggregate; `architecture.md` AR11–AR12; `1-4-storage-foundations-dexie-schema-uselocalstorage-hook-base-zod-schemas.md`]

1. **Yes path — persistence-then-flow (FR39, UX-DR20)** — Given **`ButtonPair`** is revealed (Story 7.3), when the user taps **`[Yes, I hear it]`**, then **`audiblytics.day14State`** is updated to **`{ fired: true, result: 'yes' }`** via validated storage (**`useLocalStorage`** / shared write path) **before** any UI transition that shows celebratory copy or outcome-phase layout. The Yes control stays full **`--forest`**; No desaturates to **`--rose-dim`**. Italic EB Garamond outcome copy fades in (**300ms**, **`prefers-reduced-motion: reduce`** → instant): *"That's the entire reason this app exists. Keep going."* [Source: `epics.md` Story 7.4; `ux-design-specification.md` § Day14Takeover states / Flow J3 feedback — **outcome strings: epics override** where UX Flow J3 differs]

2. **No path — persistence-then-flow (FR39)** — Given **`ButtonPair`** is visible, when the user taps **`[No, not really]`**, then **`audiblytics.day14State`** is updated to **`{ fired: true, result: 'no' }`** **before** any outcome UI. No stays full **`--brick`**; Yes desaturates to **`--sage-dim`**. Italic Garamond copy fades in (**300ms**, respect reduced motion): *"Two weeks isn't always enough. Keep going."* (**Canonical copy from epics** — UX Flow J3 line that says *"Recordings are saved…"* is **not** used for MVP.) [Source: `epics.md` Story 7.4]

3. **Ghost continue — timing & placement (UX-DR20)** — Given outcome copy has **entered the DOM** (outcome-yes / outcome-no state), when **3 seconds** elapse, then a **`ghost-continue`** **`Button`** appears **bottom-right** with label **`Continue to today →`** (per epics AC; UX alternate string *"Continue to today's paragraph"* may appear in mocks — **epics label wins** for acceptance). **`prefers-reduced-motion`** → omit opacity transition on ghost reveal (**instant**). [Source: `epics.md` Story 7.4; `ux-design-specification.md` — `ghost-continue` variant, GhostContinueButton 300ms fade when motion OK]

4. **Continue — dismiss takeover (FR40, AR14)** — Given the ghost button is visible, when the user activates **`Continue to today →`**, then **`Day14Takeover`** unmounts, **`useDay14Trigger()`** evaluates to **`false`** because **`fired === true`**, and normal route **`children`** (Today / current URL) render under **`Day14Gate`**. Prefer **`next/navigation`** **`router.push('/')`** (or Today canonical path per repo) **after** state is already persisted — no duplicate writes. [Source: `epics.md` Story 7.4]

5. **Force-quit survivability (FR39 + persistence-then-flow)** — Given the user tapped Yes or No, when they kill the tab **before** outcome copy paints, then on next open **`audiblytics.day14State.fired === true`** and **`result`** is **`'yes'`** or **`'no'`**, so the takeover **does not** re-fire (Story 7.1 **`useDay14Trigger`** contract). **Implementation implication:** persisted write must not depend on React render of outcome copy. [Source: `epics.md` Story 7.4]

6. **Day-30 scope boundary** — Given **`fired`** is true, when the calendar advances to Day 30 / next milestone, then **no** new trigger logic is added here — explicit **out of scope** (future epic/story). [Source: `epics.md` Story 7.4]

## Tasks / Subtasks

- [x] **Task 1 — `persist-day-14-outcome.ts` (NEW)** (AC: 1, 2, 5)
  - [x] 1.1 Add **`src/features/day14/persist-day-14-outcome.ts`** per **`architecture.md`** tree (`features/day14/`).
  - [x] 1.2 Export **`persistDay14Outcome(result: 'yes' | 'no'): void`** (sync) that writes **`{ fired: true, result }`** validated by **`day14StateSchema`**, using **`audiblytics.day14State`**.
  - [x] 1.3 Uses validated storage writes via **`src/lib/storage/use-local-storage.ts`** (`writeDay14State`) — no ad-hoc `localStorage`.

- [x] **Task 2 — `use-day-14-state.ts` — commit API** (AC: 1, 2, 5)
  - [x] 2.1 Expose **`commitYesNo(result: 'yes' | 'no')`** invoking **`persistDay14Outcome`**; reactivity comes from **`useLocalStorage`** sync + cross-tab event.
  - [x] 2.2 **`ButtonPair` `committing` state (UX-DR22):** buttons disable during the write and are locked after choice.

- [x] **Task 3 — `Day14Gate.tsx` + `Day14Takeover.tsx` — state machine completion** (AC: 1–4)
  - [x] 3.0 Gate passes **stable callbacks** into dynamic **`Day14Takeover`** (commit + dismiss). `Day14Takeover` remains UI-only (no `features/` imports).
  - [x] 3.1 Machine extends **`awaiting-decision` → `outcome-yes` | `outcome-no`** only after persist.
  - [x] 3.2 Yes/No handlers call **`onCommitOutcome`** first, then transition UI (persistence-then-flow ordering).
  - [x] 3.3 Outcome copy uses **`text-base`**, italic, **`text-ink-soft`**, with **300ms** fade (instant on reduced motion).
  - [x] 3.4 After **3000ms**, reveals **`Button variant="ghost-continue"`** bottom-right; fade is **300ms** when motion allowed.
  - [x] 3.5 Continue calls **`router.push('/')`**; takeover unmount is controlled by `Day14Gate` dismiss + persisted `fired`.

- [x] **Task 4 — `ButtonPair.tsx` — chosen vs muted visuals** (AC: 1, 2)
  - [x] 4.1 Added `chosen` + `committing` props: chosen side stays full **forest/brick**, the other uses **--sage-dim / --rose-dim**.

- [x] **Task 5 — Verification** (AC: all)
  - [x] 5.1 **`pnpm tsc --noEmit`** clean.
  - [x] 5.2 Automated tests pass; lint clean for touched Day-14 files.
  - [x] 5.3 Manual behavior: Continue hides takeover; `useDay14Trigger()` blocks refire when `fired === true`.

## Dev Notes

### Epic / dependency context

| Story | Ownership |
|-------|-----------|
| **7.1** | **`useDay14Trigger()`** — reads **`fired`**; must go **`false`** after this story’s persist. |
| **7.2** | **`Day14Gate`** — unblocks **`children`** when trigger not **`true`**. |
| **7.3** | **`Day14Takeover`** shell, **`CompositePlayer`**, **`ButtonPair`** reveal — this story **owns** Yes/No **effects**, **outcome UI**, **ghost continue**. |
| **1.4** | **`day14StateSchema`**, **`useLocalStorage`** — **do not** drift keys or shapes. |

### Architecture compliance

| Topic | Requirement |
|--------|-------------|
| **AR11–AR12** | Single **`audiblytics.day14State`** key; **only** **`useLocalStorage`** stack — no ad-hoc **`localStorage`**. |
| **AR14** | Gate already layout-level; **no URL bypass** of persisted **`fired`**. |
| **AR18** | **`components/audiblytics/Day14Takeover.tsx` MUST NOT import `features/`** (epics **AR18**). Wire **`commitYesNo`** from **`app/_internal/Day14Gate.tsx`**: gate calls **`useDay14State()`** (or equivalent) and passes **`onCommitYes` / `onCommitNo`** (or **`onCommitOutcome`**) into **`Day14Takeover`**. Takeover may use **`next/navigation`** for Continue. |
| **File locations** | **`persist-day-14-outcome.ts`**, **`use-day-14-state.ts`**, **`use-day-14-trigger.ts`**, **`Day14Gate.tsx`**, **`Day14Takeover.tsx`**, **`ButtonPair.tsx`** — paths per **`architecture.md`** § tree (~1009–1062). |

### Technical requirements

- **Persistence-then-flow:** If React 18 batching blurs ordering, use **`queueMicrotask`** / **`flushSync`** **only** if a measured bug appears — default **synchronous** persist + **then** **`setState`**.
- **Cross-tab:** **`useLocalStorage`** already syncs **`storage` events** — ensure **`commitYesNo`** triggers internal update so **`Day14Gate`** re-renders if another tab cleared state (edge case).
- **Accessibility:** Ghost button is **not** the first commit action (follows UX rule — primary binary already committed); ensure **`aria-live="polite"`** for outcome copy if not redundant with 7.3 live region.

### Project Structure Notes

| Artifact | Path |
|----------|------|
| Persist helper | `src/features/day14/persist-day-14-outcome.ts` |
| State hook | `src/features/day14/use-day-14-state.ts` |
| Layout gate (props seam) | `src/app/_internal/Day14Gate.tsx` |
| Takeover UI | `src/components/audiblytics/Day14Takeover.tsx` |
| Binary buttons | `src/components/audiblytics/ButtonPair.tsx` |
| Schema | `src/lib/schemas/day14-state.schema.ts` |
| Storage hook | `src/lib/storage/use-local-storage.ts` |

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 7, Story 7.4]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — AR11–AR14, AR18, components tree, `audiblytics.day14State`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` — § Day14Takeover, § ButtonPair (`committing`), `ghost-continue`, reduced motion]
- [Source: `_bmad-output/implementation-artifacts/7-3-day14takeover-ui-compositeplayer-same-word-match-heuristic.md` — Story 7.3 boundary + component contracts]
- [Source: `_bmad-output/implementation-artifacts/1-4-storage-foundations-dexie-schema-uselocalstorage-hook-base-zod-schemas.md` — `day14StateSchema`]

### Previous story intelligence (Story 7.3)

- **`onYes` / `onNo`** were explicitly stubs — **replace** with **`commitYesNo`** supplied by **`Day14Gate`** ( **`useDay14State`**) and passed **into** **`Day14Takeover`** per **AR18**.
- **`ButtonPair`** fade-in **400ms** is playback reveal; **this story** adds **300ms** outcome copy + **3s** ghost delay — **do not** reuse the 400ms timing for outcome text.
- **`CompositePlayer`** / non-dismissable dialog — **unchanged**; only extend **post-decision** phases.

### Git intelligence summary

Repository history unavailable in this environment — rely on story files + planning artifacts above.

### Latest technical specifics

Skipped per execution constraints — follow **`next/navigation`**, **`useLocalStorage`**, and shadcn **`Button`** **`ghost-continue`** patterns in **`ux-design-specification.md`**.

### Project context reference

No `project-context.md` found in workspace glob — use **`architecture.md`**, **`ux-design-specification.md`**, **`epics.md`**, and prior implementation-artifact stories as primary sources.

## Dev Agent Record

### Agent Model Used
claude-4.6-sonnet-medium-thinking (auto-sprint)

### Debug Log References

### Completion Notes List

Persistence + outcome flow implemented end-to-end:
- `persistDay14Outcome` writes validated `{ fired: true, result }` to `audiblytics.day14State` (sync) before any outcome UI.
- `commitYesNo` exposes a single blessed commit path for `Day14Gate`.
- `Day14Gate` latches takeover for the current session so outcome + ghost continue remain visible even after `useDay14Trigger()` flips false due to `fired === true`.
- `Day14Takeover` implements `awaiting-decision → outcome-yes/outcome-no`, 300ms outcome fade (reduced motion aware), then a 3000ms ghost-continue reveal using `variant="ghost-continue"`. Continue pushes `/` and dismisses takeover.
- `ButtonPair` now supports `chosen` + `committing` for forest/brick vs sage/rose muted visuals and write-race disabling.

### File List

 - `src/features/day14/persist-day-14-outcome.ts`
 - `src/features/day14/persist-day-14-outcome.test.ts`
 - `src/features/day14/use-day-14-state.ts` (added `commitYesNo`)
 - `src/lib/storage/use-local-storage.ts` (added `DAY14_STATE_STORAGE_KEY`, `readDay14State`, `writeDay14State`)
 - `src/app/_internal/Day14Gate.tsx` (latched takeover + commit/dismiss wiring)
 - `src/components/audiblytics/Day14Takeover.tsx` (outcome + ghost continue state machine)
 - `src/components/audiblytics/ButtonPair.tsx` (chosen/muted + committing disable)
 - `src/components/ui/button.tsx` (added `ghost-continue` variant)
