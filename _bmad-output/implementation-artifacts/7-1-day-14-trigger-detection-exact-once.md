# Story 7.1: Day-14 Trigger Detection (Exact-Once)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Priyank,
I want the system to detect my 14th distinct day-of-use exactly once and persist a flag so it never fires twice,
so that the Day-14 takeover lands at the right moment with full surprise and never re-fires irritatingly.

## Acceptance Criteria

1. **Hook contract (FR37, NFR12)** — Given `src/features/day14/use-day-14-trigger.ts` exists, when consumed by layout-level **Day14Gate** (Story 7.2), then the hook’s resolved value is **`true`** iff **`distinctDaysOfUse() === 14`** AND **`audiblytics.day14State.fired === false`** AND there exists **at least one** `recordings` row with **`dayOfUse === 1`**. If **`fired === true`**, the hook resolves **`false`** on every subsequent open (FR40, NFR12 — never re-fires). [Source: `epics.md` Story 7.1]

2. **Premature suppression** — Given **`distinctDaysOfUse() === 13`**, when the hook runs, then it resolves **`false`** (no premature takeover). [Source: `epics.md` Story 7.1]

3. **No Day-1 recording edge case (UX §J3 vs epic)** — Given **`distinctDaysOfUse() === 14`** and **`fired === false`** but **no** recording exists with **`dayOfUse === 1`** in Dexie `recordings`, when the hook runs, then it resolves the literal **`'no-recording'`** (not `true`). Story 7.3 / Today-route banner consume this; **takeover does not fire** until recordings satisfy the gate on a later app open. **Canonical behavior for this repo:** follow **`epics.md` Story 7.1 / 7.3** (not older UX prose that suggested the takeover still fires without a Day-1 clip). [Source: `epics.md` Story 7.1, Story 7.3]

4. **Evaluation timing** — Trigger logic is evaluated for **layout mount / app open** (where **`Day14Gate`** will live), **not** as a side effect of intra-session navigation alone. Implementation guidance: drive off **`useDay14Trigger`** (or equivalent) used from **`Day14Gate`** so the decision aligns with “first paint of the shell,” not random route rerenders; **`fired`** still provides exact-once persistence across opens. [Source: `epics.md` Story 7.1]

## Tasks / Subtasks

- [x] **`src/lib/schemas/day14-state.schema.ts` + `src/lib/storage/use-local-storage.ts`** (AC: 1, 2)
  - [x] Ensure **`audiblytics.day14State`** shape matches architecture: `{ fired: boolean; result: 'yes' | 'no' | null }` with Zod validation on read/write (FR39 prelude — **read path** required here for **`fired`**).

- [x] **`src/features/day14/use-day-14-state.ts`** (AC: 1) — if not already present per tree
  - [x] Thin reactive wrapper over **`useLocalStorage`** for **`audiblytics.day14State`** — **no** raw `localStorage` in components (architecture § localStorage policy).

- [x] **`src/features/day14/use-day-14-trigger.ts`** (AC: 1–4)
  - [x] Import **`distinctDaysOfUse`** from **`src/lib/day-counter/index.ts`** (UTC **`audiblytics.daysOfUse`** length — NFR13-aligned primitive).
  - [x] Subscribe to **`fired`** via **`useDay14State`** (or validated **`useLocalStorage`**).
  - [x] Query Dexie **`recordings`** for **`dayOfUse === 1`** (indexed field per schema). Prefer **`useLiveQuery`** from **`dexie-react-hooks`** so the **`no-recording`** edge updates when a Day-1 clip appears later without full reload, while **`fired`** still blocks repeat takeover.
  - [x] Export a clear union type, e.g. **`Day14TriggerResult = false | true | 'no-recording'`**, and document mapping for Story 7.2 (**boolean gate**) vs Story 7.3 (**banner path**).

- [x] **Verification (manual / NFR26)**
  - [x] **`pnpm tsc --noEmit`** clean.
  - [x] Matrix: 13 days → `false`; 14 days + fired → `false`; 14 days + !fired + no day-1 row → `'no-recording'`; 14 days + !fired + day-1 row → `true`.

## Dev Notes

### Epic / dependency context

- **Story 7.2** owns **`Day14Gate`** + layout wiring; **this story** owns **pure trigger semantics** only — **do not** mount takeover UI here.
- **Story 7.4** owns persisting **`fired`** after Yes/No; **this story** only **reads** **`fired`** for gating.
- **Story 3.x** owns recordings schema and **`dayOfUse`** stamping — **do not** redefine recording shape.

### Architecture compliance

| Artifact | Requirement |
|----------|-------------|
| **NFR12** | Exact-once firing: **`fired`** is the hard stop; hook must never yield **`true`** after **`fired === true`**. |
| **Tree** | **`src/features/day14/use-day-14-trigger.ts`**, **`use-day-14-state.ts`**, **`src/lib/day-counter/index.ts`**, **`src/lib/storage/db.ts`** per `architecture.md` § project tree (~1058–1112). |
| **Imports** | `features/` may import `lib/`; **no** `features/day14` → `app/` imports (AR18). |
| **Day counter** | **`distinctDaysOfUse()`** reads **`audiblytics.daysOfUse`** — same primitive as streak/retention (architecture § Day-counting primitive). |

### Technical requirements

- **Dexie access:** Use **`db`** from **`src/lib/storage/db.ts`**; validate recording rows against **`recording.schema.ts`** on write paths elsewhere — read path may use live query + optional first-row check.
- **SSR:** Dexie runs client-only; gate hook runs inside **`'use client'`** ancestors (Day14Gate). Guard **`typeof window`** if any synchronous path risks SSR touch (prefer hooks that already assume client).
- **Naming:** Hook file **`use-day-14-trigger.ts`**, exported **`useDay14Trigger`** (architecture naming table).

### Project Structure Notes

| Area | Path |
|------|------|
| Trigger hook | `src/features/day14/use-day-14-trigger.ts` |
| Day-14 state read | `src/features/day14/use-day-14-state.ts` |
| Day counter | `src/lib/day-counter/index.ts` |
| Dexie + DB | `src/lib/storage/db.ts` |
| day14 Zod | `src/lib/schemas/day14-state.schema.ts` |

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 7, Story 7.1]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — § Data Architecture, § Day-counting primitive, § Day-14 gate snippet, § project tree `features/day14/`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` — Flow J3 edge case copy for **`no-recording`** banner (implemented in later stories)]

## Dev Agent Record

### Agent Model Used

claude-4.6-sonnet-medium-thinking (auto-sprint)

### Debug Log References

### Completion Notes List

- `day14StateSchema` pre-existed; added `useDay14State`, `evaluateDay14Trigger`, `useDay14Trigger`.
- Reactive day count via `useDistinctDayOfUse` (same primitive as `distinctDaysOfUse`).
- Dexie `useLiveQuery` on `recordings.dayOfUse === 1`; loading → `false`.
- 6 unit tests cover AC matrix (48/48 suite pass, tsc clean).

### File List

- `src/features/day14/use-day-14-state.ts` (new)
- `src/features/day14/evaluate-day-14-trigger.ts` (new)
- `src/features/day14/use-day-14-trigger.ts` (new)
- `src/features/day14/evaluate-day-14-trigger.test.ts` (new)

---

**Completion note:** Ultimate context engine analysis completed — comprehensive developer guide created.
