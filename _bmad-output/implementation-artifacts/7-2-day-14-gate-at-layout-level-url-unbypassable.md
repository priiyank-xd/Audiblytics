# Story 7.2: Day-14 Gate at Layout Level (URL-Unbypassable)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Priyank,
I want a `<Day14Gate>` component mounted in `src/app/layout.tsx` that short-circuits route render when the trigger fires,
so that no URL change, TopNav click, or browser back button can bypass the takeover.

## Acceptance Criteria

1. **Gate component contract (FR37, AR14)** — Given `src/app/_internal/Day14Gate.tsx` is opened, when the file is read, then it is a **`'use client'`** component that calls **`useDay14Trigger()`** from Story 7.1 (`src/features/day14/use-day-14-trigger.ts`). When the hook resolves **`true`**, it renders **`Day14Takeover`** (lazy via **`next/dynamic`** per architecture AR22 / performance section). When the hook resolves **`false`** or **`'no-recording'`**, it renders the **full normal layout subtree** (shell + route **`{children}`**) — **`'no-recording'`** must **not** mount the takeover (Story 7.3’s Today-route banner path); only **`true`** opens the gate. [Source: `epics.md` Story 7.2; Story 7.1 union type]

2. **Layout mount** — Given `src/app/layout.tsx` is opened, when the file is read, then **`Day14Gate`** wraps **all** layout chrome that must disappear during takeover (**`<TopNav>`**, **`<DayRail>`**, center **`{children}`**, **`<StatRail>`**, **`<HonestyFooter>`** — same composition as Story 1.3 shell) so that when the gate is in takeover mode, **no** shell chrome paints (per UX flow §J3 “full-bleed”; epics: TopNav / DayRail / StatRail suppressed). The root layout file itself remains a **server component** (no `'use client'` on `layout.tsx`); only **`Day14Gate`** is client. [Source: `epics.md` Story 7.2; `architecture.md` server vs client table]

3. **URL-unbypassable behavior** — Given the gate is showing **`Day14Takeover`**, when the user clicks any **TopNav** link (Today / Collection / Review / Settings), then the **URL updates** but the **layout still resolves to takeover** (gate is **above** route segments — AR14). The user **cannot** navigate away via in-app links while the trigger remains **`true`**. [Source: `epics.md` Story 7.2]

4. **Browser back** — Given the gate is in **`Day14Takeover`** mode, when the user presses **browser back**, then the history URL may change but the **same gate condition** applies at the restored URL and **takeover continues** to render until **`useDay14Trigger()`** no longer returns **`true`** (e.g. after Story 7.4 sets **`fired`** — out of scope for this story, but the gate must not “release” on back navigation alone). [Source: `epics.md` Story 7.2]

## Tasks / Subtasks

- [x] **`src/app/_internal/Day14Gate.tsx`** (AC: 1, 2)
  - [x] `'use client';` at top; named export **`Day14Gate`**.
  - [x] **`const trigger = useDay14Trigger()`** — branch explicitly: **`trigger === true`** → dynamic **`Day14Takeover`**; **`trigger === false || trigger === 'no-recording'`** → render **`children`** (the full shell subtree passed from `layout.tsx`).
  - [x] Lazy-load **`Day14Takeover`** with **`next/dynamic`** (`ssr: false` if needed to avoid SSR touching Dexie/browser-only paths inside takeover — align with how **`WarmUpDrill`** is loaded in architecture). Use **`@/components/audiblytics/Day14Takeover`** (Story 7.3 owns UI richness; **minimal export must exist** so the gate compiles — coordinate or add a thin placeholder only if 7.3 is not yet merged).
  - [x] Provide **`loading={null}`** or a token-free fallback so route flash does not violate “full-bleed” intent.

- [x] **`src/app/layout.tsx`** (AC: 2)
  - [x] Import **`Day14Gate`** from **`@/app/_internal/Day14Gate`** (or relative path consistent with repo).
  - [x] Restructure so **one** **`Day14Gate`** wrapper receives **all** shell markup + **`{children}`** as its **`children`** prop — when takeover is active, **`Day14Gate`** returns **only** takeover UI (no TopNav / rails / footer).

- [x] **Verification** (AC: 3, 4)
  - [x] **`pnpm tsc --noEmit`** clean.
  - [x] Manual: with trigger forced to **`true`** (temporary dev flag or mocked state — **do not ship**), click each TopNav link and confirm URL changes but takeover remains; use browser back and confirm takeover persists.

## Dev Notes

### Epic / dependency context

- **Story 7.1** owns **`useDay14Trigger`** semantics (`false | true | 'no-recording'`). This story **only** wires layout + suppression — **do not** duplicate day-count or Dexie logic here.
- **Story 7.3** owns **`Day14Takeover`** visuals and comparison UX; this story only **mounts** it when **`trigger === true`**.
- **Story 7.4** owns persisting **`fired`** after Yes/No; gate simply reads trigger state via 7.1.

### Architecture compliance

| Topic | Requirement |
|--------|----------------|
| **AR14 / FR37** | Layout-level gate — **must** sit in **`layout.tsx`** so route changes do not replace the gate. |
| **Pseudo-code drift** | `architecture.md` § Day-14 gate shows `useDistinctDayOfUse` + `day === 14` — **superseded** by **`useDay14Trigger()`** from Story 7.1 (includes **`fired`**, **`no-recording`**, Day-1 recording rule). Implement **trigger hook**, not the outdated snippet. [Source: `architecture.md` ~458–470 vs epics Story 7.1] |
| **Import boundaries** | **`app/`** may import **`features/`** and **`components/`**; **`features/`** must not import **`app/`** (AR18). Gate lives under **`app/_internal/`** and may call **`useDay14Trigger`**. |
| **Performance** | **`next/dynamic`** for **`Day14Takeover`** per architecture § Performance optimization — keeps initial bundle smaller until takeover. |

### Technical requirements

- **Shell suppression:** Implement by **conditional return** inside **`Day14Gate`**: takeover branch returns **only** the dynamic takeover component; normal branch returns the **entire** fragment that Story 1.3 defines (nav + grid + footer). Do **not** only wrap **`{page}`** — that would leave TopNav visible during takeover and **fail** AC2.
- **Hydration:** Gate runs on client; layout stays server. Avoid passing non-serializable props from server layout into client gate beyond **`ReactNode` children**.
- **HonestyFooter:** Epics name TopNav / DayRail / StatRail; architecture shell also includes **HonestyFooter** — **suppress it** in takeover mode together with the rest of the shell for a true full-bleed stage.

### Project Structure Notes

| Artifact | Path |
|----------|------|
| Gate | `src/app/_internal/Day14Gate.tsx` |
| Layout | `src/app/layout.tsx` |
| Trigger hook | `src/features/day14/use-day-14-trigger.ts` |
| Takeover UI | `src/components/audiblytics/Day14Takeover.tsx` (Story 7.3) |

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 7, Story 7.2]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — § Frontend Architecture (Day-14 gate, performance / `next/dynamic`), § project tree `app/_internal/Day14Gate.tsx`, import boundaries]
- [Source: `_bmad-output/implementation-artifacts/7-1-day-14-trigger-detection-exact-once.md` — trigger union and hook ownership]

### Latest technical specifics

Skipped — rely on locked **`next/dynamic`** pattern and Next.js 16 App Router layout composition per `architecture.md` (no external version research for this run).

## Dev Agent Record

### Agent Model Used

claude-4.6-sonnet-medium-thinking (auto-sprint)

### Completion Notes List

- `Day14Gate` branches `trigger === true` → dynamic `Day14Takeover`; else full shell `children`.
- `layout.tsx` wraps TopNav + rails + footer + `{children}` inside single `Day14Gate`.
- Thin `Day14Takeover` placeholder for 7.3 compile contract.
- 48/48 pass, tsc clean.

### File List

- `src/app/_internal/Day14Gate.tsx` (new)
- `src/app/layout.tsx` (modified)
- `src/components/audiblytics/Day14Takeover.tsx` (new — placeholder)

---

**Completion note:** Ultimate context engine analysis completed — comprehensive developer guide created.
