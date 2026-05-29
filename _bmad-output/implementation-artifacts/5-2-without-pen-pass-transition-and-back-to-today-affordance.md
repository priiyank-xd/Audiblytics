# Story 5.2: Without-Pen Pass Transition and Back-to-Today Affordance

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Priyank,
I want the warm-up to prompt me to read the same tongue-twister again without the pen after the with-pen 30 seconds,
so that I feel the contrast in articulation that proves the pen-drill thesis.

## Acceptance Criteria

1. **Without-pen pass (FR45, UX-DR23)** — Given `WarmUpDrill` is in the `transition` state (Story 5.1), when the without-pen prompt is shown, then the **same** tongue-twister string as the with-pen pass remains visible under the instruction **“Now without the pen, read it again.”**; a **second** count-up timer runs **0:00 → 0:30** in **monospace**, using the same timing discipline as the with-pen pass (monotonic clock / rAF, no material drift at 30.0s). The `aria-live="polite"` region continues to announce at **10s, 20s, 30s** elapsed for **this** pass (not re-announcing the with-pen milestones). [Source: `_bmad-output/planning-artifacts/epics.md` Story 5.1–5.2; `_bmad-output/planning-artifacts/ux-design-specification.md` `WarmUpDrill`]

2. **Exit to Today (completion paths)** — Given the without-pen timer **ends** (30.0s elapsed) **or** the user taps **“Back to today’s paragraph”**, when the action completes, then `<WarmUpDrill>` **unmounts** and the user is back on the Today screen; **focus returns to the Today screen’s first interactive element** (per epics). [Source: epics Story 5.2]

3. **In-component back in either pass (FR47)** — Given the user is in the **with-pen** pass or the **without-pen** pass, when they use the **in-component** back/exit control (not browser back), then the warm-up **exits cleanly** with **no** recording and **no** scoring UI (FR47). [Source: epics Story 5.2]

4. **Scope boundary (Story 5.3)** — Do **not** add “Record this pass,” Voice Journal persistence, or warm-up-specific Dexie rows — recording belongs to Story 5.3. [Source: epics Story 5.3]

## Tasks / Subtasks

- [ ] **State machine** (AC: 1, 4)
  - [ ] Extend `src/features/warm-up/use-warm-up-state-machine.ts`: after `transition`, enter a distinct **`without-pen`** (or equivalent) state where the **second** 30s window runs; at 30.0s elapsed → invoke **`onComplete`** / **`onExitToToday`** (name as implemented) to signal parent to unmount.
  - [ ] Preserve the **same** `phrase` reference/string across `running` → `transition` → without-pen — no re-roll.

- [ ] **`WarmUpDrill` UI** (AC: 1–3)
  - [ ] In `src/components/audiblytics/WarmUpDrill.tsx`, render the without-pen instruction + phrase + second timer; keep **`role="region"`** and **`aria-label="Pen-drill warm-up, 30 seconds"`** (or adjust label only if both passes need distinct SR wording — document if changed).
  - [ ] Add **`[Back to today’s paragraph]`** using **exact** label copy from UX. Wire to the same exit path as timer completion.
  - [ ] Ensure an **in-component** exit is available in **both** passes (e.g. shared top **Back** / **Close warm-up** control **or** the primary **Back to today’s paragraph** button visible whenever the drill is open — choose one UX-coherent pattern; **do not** rely on browser **Back**).

- [ ] **Today integration & focus** (AC: 2)
  - [ ] Parent (`src/app/page.tsx` or the component that `next/dynamic`-loads `WarmUpDrill`): on exit, set state so the drill unmounts; **move focus** to the first interactive element on Today per epics — implement by **ref on the Warm-Up launcher button** (recommended: returns focus to control that opened the flow) **or** first focusable in `<main>` reading order; **avoid** focusing disabled controls or off-screen elements.

- [ ] **Manual verification** (NFR26)
  - [ ] With-pen: back exits with **no** scoring strings.
  - [ ] Without-pen: timer fires at 30s, phrase unchanged, live region cadence correct.
  - [ ] **Keyboard:** Tab through controls; exit paths reachable without mouse.
  - [ ] **Screen reader:** Without-pen announcements not confused with with-pen milestones.

## Dev Notes

### Epic and dependency context

- **Epic 5:** Pen-drill from Today; bundled phrases; **never** score (FR47). [Source: `_bmad-output/planning-artifacts/epics.md` Epic 5]
- **Depends on Story 5.1** for `transition` state, `drill-library`, lazy load from Today, and `WarmUpDrill` shell. This story **owns** the without-pen timer + exit affordances.

### UX vs epics

- UX lists `pre-warmup` + separate Start and labels timer as “countdown”; **epics** mandate **count-up** and single-tap entry. Continue **epics + Story 5.1/5.2** as source of truth for timers.
- UX **`complete`** state (“auto-routes back after another 30s”) matches epics: **timer end** triggers exit alongside **Back to today’s paragraph**.

### Architecture compliance

- **Lazy loading:** `WarmUpDrill` remains loaded via **`next/dynamic`** from Today (AR22); do not import the composite eagerly in `page.tsx`. [Source: `_bmad-output/planning-artifacts/architecture.md` ~517, ~1022, ~1051–1053]
- **State machine file:** `features/warm-up/use-warm-up-state-machine.ts` — architecture shows **idle → with-pen (30s) → without-pen → done**; align naming with implementation **without** inventing a global state library (NFR26).

### Technical requirements

- **Second timer:** Reset elapsed baseline when entering without-pen; fire completion at **30.0s** for **that** pass only.
- **No scoring:** No stars, rubrics, “good job,” or quality copy (FR47).
- **Exit:** Unmount drill only — **do not** navigate away from `/` if Today is already home; restore underlying Today content.

### File Structure Notes

| Area | Path |
|------|------|
| State machine | `src/features/warm-up/use-warm-up-state-machine.ts` |
| UI | `src/components/audiblytics/WarmUpDrill.tsx` |
| Entry / focus | `src/app/page.tsx` (or Today wrapper owning `open` state + ref) |

### Testing requirements

- **No Vitest/Jest in MVP** (NFR26). Manual checks listed under Tasks.

### References

- Epics — Story 5.2: `_bmad-output/planning-artifacts/epics.md`
- PRD — FR45–FR47: `_bmad-output/planning-artifacts/prd.md` §770+
- Architecture — `WarmUpDrill`, `features/warm-up/`: `_bmad-output/planning-artifacts/architecture.md`
- UX — `WarmUpDrill` anatomy, “Back to today’s paragraph”: `_bmad-output/planning-artifacts/ux-design-specification.md`

### Previous story intelligence (5.1)

- Story 5.1 establishes **`transition`** at 30s with instruction **“Now without the pen, read it again.”** but defers **second timer**, **Back to today’s paragraph**, and **focus restore** to **this** story.
- Reuse **same** phrase display component/text path for without-pen; **do not** re-randomize `pickRandomPhrase()` on state change.

### Latest technical research

Skipped per run directive (no web research). Use locked stack from architecture / `package.json`.

### Project context reference

`project-context.md` was not found under the repo glob at story creation time; follow `architecture.md` and epics as sources of truth.

## Dev Agent Record

### Agent Model Used

_(Story context generation — not applicable)_

### Debug Log References

### Completion Notes List

### File List

_(Populated by dev agent during implementation)_

---

**Story completion status:** ready-for-dev — Ultimate context engine analysis completed for Story 5.2 (web research omitted per run constraints).
