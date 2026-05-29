# Story 5.1: Tongue-Twister Library and WarmUpDrill Component (with-pen pass)

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Priyank,
I want a single-tap warm-up icon on the Today screen that opens a 30-second with-pen drill showing one randomly selected tongue-twister from a bundled library,
so that I can prime my articulators before reading without leaving the daily-ritual flow.

## Acceptance Criteria

1. **`drill-library.ts` (FR44)** — Given `src/features/warm-up/drill-library.ts` is opened, when the file is read, then at least **10 distinct** tongue-twister phrases are exported as a constant array; phrases lean toward classic playful tongue-twisters (e.g. “red lorry, yellow lorry”, “Peter Piper picked a peck…”), not clinical instructional copy. [Source: `_bmad-output/planning-artifacts/epics.md` Story 5.1]

2. **Today entry point (FR43, UX §J2)** — Given the user is on the Today screen, when the meta-actions row renders, then a **`⏵ Warm-Up`** icon-button is visible; a single tap mounts `<WarmUpDrill>` **lazy-loaded via `next/dynamic`** (AR22). [Source: epics Story 5.1, `_bmad-output/planning-artifacts/epics.md` AR22]

3. **With-pen pass UI (FR44, UX-DR23)** — Given `WarmUpDrill` mounts and the with-pen pass starts, then instruction text reads **“Hold a pen between your teeth. Read this out loud:”** with a **randomly selected** phrase from `drill-library` shown below; a **count-up** timer mono-renders **`0:00` → `0:30`**; an **`aria-live="polite"`** region announces timer progress **every 10 seconds** (e.g. at 0:10, 0:20, 0:30 boundaries). [Source: epics Story 5.1, `_bmad-output/planning-artifacts/ux-design-specification.md` WarmUpDrill]

4. **Transition at 30s (boundary with Story 5.2)** — Given the timer reaches 30 seconds, when the transition fires, then the component enters the **`transition`** state and the primary instruction switches to **“Now without the pen, read it again.”** Do **not** implement the full without-pen second timer, “Back to today’s paragraph” completion, or recording affordances here — those belong to Stories **5.2** and **5.3**. [Source: epics Stories 5.1–5.2]

5. **No scoring (FR47)** — Given the warm-up runs through this story’s scope, the system **never** scores, rates, or assesses the drill (no rubric, no pass/fail, no stars). [Source: epics Story 5.1]

## Tasks / Subtasks

- [ ] **Library** (AC: 1)
  - [ ] Add `src/features/warm-up/drill-library.ts` exporting `TONGUE_TWISTERS: readonly string[]` (length ≥ 10) plus a small `pickRandomPhrase()` (or equivalent) using **uniform random** selection **once per mounted session** (new phrase when user opens warm-up again).

- [ ] **State machine hook** (AC: 3–4)
  - [ ] Add or extend `src/features/warm-up/use-warm-up-state-machine.ts`: states must include at least `running` (with-pen, 0–30s) and `transition` (instruction swap at 30s). Optionally align naming with UX (`pre-warmup`, etc.) only if required to satisfy AC without adding an extra tap beyond epic flow — **epics favor**: Today icon tap → with-pen pass starts (no duplicate “Start” unless already required elsewhere).

- [ ] **`WarmUpDrill` UI** (AC: 3–5)
  - [ ] Implement `src/components/audiblytics/WarmUpDrill.tsx` as a **client** component: typography matches Today patterns (Garamond body per UX); timer uses **monospace** class for `0:00` display; container **`role="region"`** and **`aria-label="Pen-drill warm-up, 30 seconds"`** per UX-DR23.

- [ ] **Today integration** (AC: 2)
  - [ ] On Today (`src/app/page.tsx`), add **`next/dynamic(() => import(...), { ssr: false })`** (or documented equivalent) for `WarmUpDrill`; wire **meta-actions** row per UX (`▶ Play paragraph · ⏵ Warm-Up · ↻ Generate` pattern — exact neighbors may already exist from Epic 1).

- [ ] **Manual verification** (NFR26: no automated test framework)
  - [ ] Cold-load bundle sanity: warm-up chunk loads **only** after tap (AR22 / NFR1 mitigation).

## Dev Notes

### Epic and dependency context

- **Epic 5 goal:** 30s pen-drill from Today; bundled phrases; at 30s → without-pen prompt; optional recording later; **never** score. [Source: `_bmad-output/planning-artifacts/epics.md` Epic 5]

- **Cross-epic:** Depends on **Epic 1** Today shell / meta-actions (FR43). Epic 3 recording is **out of scope** for 5.1. [Source: epics Inter-Epic Dependencies table]

### UX vs epics (resolve before coding)

- **UX spec** lists `pre-warmup` with a separate Start control and diagram labels timer as “countdown”; **epics** specify **count-up** `0:00→0:30` and a **single tap** on Today to mount the drill. **Implement epics + Story AC** for this increment: count-up timer, single-tap entry from Today, phrase visible when with-pen pass starts. If a separate Start button is needed for a11y, document the rationale in the PR — default path is **no second tap**. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` WarmUpDrill; epics Story 5.1]

### Architecture compliance

- **Code-splitting:** `WarmUpDrill` must be lazy via **`next/dynamic`** so Today stays small (AR22, architecture §lazy loading). [Source: `_bmad-output/planning-artifacts/architecture.md` lines ~517, ~1022, ~1051–1053]

- **Folder layout:** `features/warm-up/drill-library.ts`, `features/warm-up/use-warm-up-state-machine.ts`; composite at `components/audiblytics/WarmUpDrill.tsx`. Epics explicitly reference **`src/features/warm-up/drill-library.ts`** — keep that path. [Source: architecture folder tree; epics Story 5.1]

- **Stack:** Next.js App Router, TS, Tailwind 4, shadcn/ui — **no** new animation/toast/state libraries (NFR26). [Source: architecture Project Context]

### Technical requirements

- **Timer:** Count **up** to 30s (not down). Fire transition exactly at **30.0s** elapsed from with-pen start (use `requestAnimationFrame` + timestamps or monotonic clock — avoid `setInterval` drift for the boundary).

- **Live region:** Dedicated element with `aria-live="polite"`; announce at **10s, 20s, 30s** elapsed (not every second).

- **Random phrase:** Use `crypto.getRandomValues` or `Math.random` — acceptable for non-crypto UX shuffle; document if deterministic tests are ever added post-MVP.

- **Transition state:** Show **same** phrase under the new instruction until Story 5.2 extends behavior.

### File Structure Notes

| Area | Path |
|------|------|
| Phrase data | `src/features/warm-up/drill-library.ts` |
| State machine | `src/features/warm-up/use-warm-up-state-machine.ts` |
| UI | `src/components/audiblytics/WarmUpDrill.tsx` |
| Entry | `src/app/page.tsx` (dynamic import + button) |

### Testing requirements

- **No Vitest/Jest in MVP** (NFR26). Verify manually: lazy chunk, timer, aria announcements (VoiceOver or Chrome a11y tree), **no** scoring UI strings.

### References

- Epics — Story 5.1: `_bmad-output/planning-artifacts/epics.md` (§Epic 5, Story 5.1)
- Architecture — structure & lazy load: `_bmad-output/planning-artifacts/architecture.md` (WarmUpDrill, `features/warm-up/`, `next/dynamic`)
- UX — WarmUpDrill anatomy & a11y: `_bmad-output/planning-artifacts/ux-design-specification.md` (`WarmUpDrill`)
- AR22: `_bmad-output/planning-artifacts/epics.md` (Architecture Requirements table)

### Latest technical research

Skipped per sprint directive (no web research). Use locked stack versions from architecture / repo `package.json` when implementing.

### Project context reference

`project-context.md` was not found under the repo glob at story creation time; follow `_bmad-output/planning-artifacts/architecture.md` and epics as sources of truth.

## Dev Agent Record

### Agent Model Used

_(Story context generation — not applicable)_

### Debug Log References

### Completion Notes List

### File List

_(Populated by dev agent during implementation)_

---

**Story completion status:** ready-for-dev — Ultimate context engine analysis completed for Story 5.1 (web research omitted per run constraints).
