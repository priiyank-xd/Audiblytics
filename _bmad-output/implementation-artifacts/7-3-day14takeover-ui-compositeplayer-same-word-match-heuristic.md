# Story 7.3: Day14Takeover UI + CompositePlayer Same-Word Match Heuristic

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Priyank,
I want the takeover to render full-bleed with the headline "Listen to how far you've come.", a composite player that attempts to match earliest and most-recent recordings on the same hard word, and binary buttons that stay hidden until first playback completes,
so that the audio comparison itself is the moment of truth — engineered to force the listen, not the click-through.

## Acceptance Criteria

> Canonical product behavior for **`no-recording`**: **`epics.md` Story 7.1 + 7.3** — **no takeover** when Day-1 clip missing; **Today-route banner** instead. Older UX prose that implied takeover still fires without Day-1 is **deprecated** for this repo. [Source: `_bmad-output/implementation-artifacts/7-1-day-14-trigger-detection-exact-once.md` AC3]

1. **Full-bleed shell + typography (UX-DR20, FR37)** — Given the Day-14 trigger fires and **`Day14Takeover`** mounts (only when **`useDay14Trigger()` === `true`** — gate already enforced by Story 7.2), when the takeover renders, then the background is full-bleed **`--cream`** with **no** overlay scrim; the headline reads **"Listen to how far you've come."** in **EB Garamond `text-5xl`** (per epics AC — if UX mock shows `text-3xl`, **epics wins**); subhead caption **`Day 14 · YYYY-MM-DD`** in **mono `text-sm`** (use **today’s UTC calendar date** from the same source as day-counter / display consistency); layout shell (TopNav, DayRail, StatRail, HonestyFooter) remains suppressed because **`Day14Gate`** does not render them in takeover mode (Story 7.2). [Source: `epics.md` Story 7.3; `ux-design-specification.md` § Day14Takeover]

2. **FR38 selection heuristic (`select-day-1-recording`)** — Given **`src/features/day14/select-day-1-recording.ts`** runs against Dexie when building the comparison, when it picks recordings, then:
   - It **first** attempts a **same hard-word** pairing: a recording with **`dayOfUse === 1`** and a **most-recent** recording (by **`recordingDate`**, same notion as Voice Journal sort) whose linked **`paragraphCache`** (via **`paragraphId`**) **hardWords** sets intersect on **normalized word string** (case-fold / trim — match **`hardWords[].word`**).
   - If such a pair exists, **`sourceA`** / **`sourceB`** are those two **`recordings`** rows, passed to **`<CompositePlayer mode="compare" sourceA={…} sourceB={…} />`**.
   - If **no** shared-hard-word pair exists, **fall back** to **whole-paragraph** comparison: **earliest** recording by **`recordingDate`** + **most-recent** recording (FR38).
   - If **no Day-1 recording exists at all**, Story 7.1 returns **`'no-recording'`** — **takeover does not mount**; implement the **soft inline banner** on the **Today** route (UX flow §J3 / UX spec edge copy): italic calm line + **`[Show me how]`** targeting RecordPanel affordance (scroll/focus pattern consistent with app — do not invent a new route). [Source: `epics.md` Story 7.3; `ux-design-specification.md` Flow J3 edge case]

3. **CompositePlayer + play gate (FR38, UX-DR22, Story 3.5 contract)** — Given **`CompositePlayer`** has rendered with resolved **`sourceA`** / **`sourceB`**, when the takeover **first paints**, then **`[Yes, I hear it]` / `[No, not really]`** **`<ButtonPair>`** is hidden with **`display: none`** (not merely `opacity: 0` — **hidden** until playback completes per UX-DR20/DR22); the **only** primary interactive control is the single **"▶ Play comparison"** (copy per UX spec). When the user taps **Play comparison**, then **sourceA** plays, **~1s silence**, **sourceB** plays (reuse Story 3.5 sequential compare semantics), row highlight **`--cream-dim`** / dim partner per UX **`CompositePlayer`** states; when **sourceB** finishes, **`onPlaybackComplete`** fires **once** and **`ButtonPair`** **fades in** over **400ms** (**opacity 0 → 1**, UX-DR36); **`prefers-reduced-motion: reduce`** → **no** opacity transition (instant reveal). [Source: `epics.md` Story 7.3; `3-5-compare-any-two-recordings-via-compositeplayer-general-purpose-mode.md`; `ux-design-specification.md` § CompositePlayer / ButtonPair]

4. **Non-dismissable modal + WCAG exception (FR37, UX-DR20, UX-DR38)** — Given the takeover is rendered, when the user inspects the dialog, then there is **no** close button, **no** Esc dismissal (**`onEscapeKeyDown={(e) => e.preventDefault()}`**), **no** overlay click-out (**`onPointerDownOutside={(e) => e.preventDefault()}`**), **no** skip link; **inline comment** in **`Day14Takeover.tsx`**: `// WCAG 2.1.2 deliberate exception — see ux-design-specification.md §Named Exceptions`; focus stays trapped (**Radix/shadcn `Dialog` with `modal={true}`**); dialog **`aria-labelledby`** points at the **`h1`** headline id. [Source: `epics.md` Story 7.3]

5. **Story 7.4 boundary** — **Yes/No persistence** (`audiblytics.day14State`, persistence-then-flow, ghost continue) is **Story 7.4**. This story **implements visible `ButtonPair` + focus order** after playback; wire **`onYes` / `onNo`** to **Story 7.4’s** persist helper when available, or **documented stubs** that do **not** write **`fired`** until 7.4 lands (avoid false “done”).

## Tasks / Subtasks

- [x] **Task 0 — Preconditions** (AC: all)
  - [x] 0.1 Confirm **Story 3.5** **`CompositePlayer`** **`mode="compare"`** + **`onPlaybackComplete`** exist (extend, do not fork a second player). If missing, implement/compare per **`3-5-compare-…md`** first or in parallel with explicit file coordination.
  - [x] 0.2 Confirm **`recording.schema.ts`**, **`paragraph-cache.schema.ts`**, **`db.recordings`**, **`db.paragraphCache`** indexes support **`paragraphId`** + **`dayOfUse`** queries (Story 3.x).

- [x] **Task 1 — `select-day-1-recording.ts` (NEW)** (AC: 2)
  - [x] 1.1 Export a pure async function (or hook wrapper if you must subscribe — prefer **async resolver** called from client **`Day14Takeover`** mount) that returns **`{ sourceA, sourceB, matchKind: 'same-word' | 'fallback-earliest-latest' }`** or a **discriminated error** if no pair (caller handles **`no-recording`** at gate level — this function may assume **`true`** trigger already implies Day-1 row exists).
  - [x] 1.2 Implement **same-word** scan: load candidate Day-1 recordings; load recent recordings; resolve **paragraph** rows; intersect **`hardWords[].word`**; pick **one** defensible pair (document tie-break: prefer **most recent** B clip when multiple As match).
  - [x] 1.3 Fallback: **global earliest** + **global latest** **`recordingDate`**.

- [x] **Task 2 — `Day14Takeover.tsx` (NEW or REPLACE placeholder)** (AC: 1, 3, 4)
  - [x] 2.1 **`'use client'`**; compose **shadcn `Dialog`** with overrides from UX spec § Day14Takeover; full-viewport **`--cream`**; **`h1`** headline + mono subhead.
  - [x] 2.2 Load comparison sources via **`select-day-1-recording`**; pass to **`CompositePlayer`**; state machine: **`awaiting-play` → `playing` → `awaiting-decision`** (labels align UX spec — internal enum names free).
  - [x] 2.3 **`ButtonPair`**: **`hidden`** until **`onPlaybackComplete`**; then **`transition-opacity duration-[400ms]`** (respect **reduced motion**).
  - [x] 2.4 **`aria-live="polite"`** wrapper when buttons reveal (per UX spec).

- [x] **Task 3 — Today-route banner (`no-recording`)** (AC: 2)
  - [x] 3.1 In the **Today** page component (architecture: center column under shell — exact file follows repo scaffold), read **`useDay14Trigger()`** (or receive prop from a thin shell wrapper **only if** needed to avoid duplicate Dexie work — prefer **single hook instance** per tree).
  - [x] 3.2 When **`trigger === 'no-recording'`**, render **soft inline banner** (no modal): copy per **`ux-design-specification.md`** § Flow J3 / edge case (“haven't recorded yet…” + **`[Show me how]`**).
  - [x] 3.3 **Do not** mount **`Day14Takeover`** for this branch (Story 7.2 already routes shell — banner lives **inside** normal **`children`** layout).

- [x] **Task 4 — Verification** (AC: all)
  - [x] 4.1 **`pnpm tsc --noEmit`** clean.
  - [x] 4.2 Manual matrix: **`true`** → full takeover, play gate works, **no** Esc/outside close; **`'no-recording'`** → Today banner, **no** takeover; **`false`** → normal app.

## Dev Notes

### Epic / dependency context

| Story | Ownership |
|-------|-----------|
| **7.1** | **`useDay14Trigger()`** union **`false \| true \| 'no-recording'`** — banner vs takeover. |
| **7.2** | **`Day14Gate`** lazy-loads **`Day14Takeover`** only for **`true`** — this story **owns component body**. |
| **3.5** | **`CompositePlayer`** compare mode + **`onPlaybackComplete`** contract — **must not diverge**. |
| **7.4** | **`fired`**, outcome copy, ghost continue — **do not implement persistence-then-flow here** unless 7.4 is merged. |

### Architecture compliance

| Topic | Requirement |
|--------|-------------|
| **File locations** | **`Day14Takeover.tsx`**, **`CompositePlayer.tsx`**, **`ButtonPair.tsx`** → **`src/components/audiblytics/`**; **`select-day-1-recording.ts`** → **`src/features/day14/`** (architecture § tree ~1012–1062). |
| **AR18** | **`features/day14`** may import **`lib/storage`**, **`lib/schemas`** — **never** import **`app/`**. |
| **Performance** | **`Day14Takeover`** remains **`next/dynamic`** from **`Day14Gate`** (Story 7.2) — do not synchronously import heavy paths in layout. |
| **Pseudo-code drift** | **`architecture.md`** Day-14 gate snippet (`useDistinctDayOfUse` + `day === 14`) is **superseded** by **`useDay14Trigger()`** (Story 7.1). |

### Technical requirements

- **Same-word normalization:** Compare **`hardWords[].word`** strings with **consistent casing** (Unicode fold or **localeLowerCase** — match **`HardWordRow`** / collection normalization if already defined).
- **Corrupt blob:** Reuse Story 3.5 / UX **`CompositePlayer`** edge row copy (**"Recording unavailable — …"**) + TTS fallback rules — **do not** silence-fail **`onPlaybackComplete`** (Day-14 reveal must still be reachable when sequence ends).
- **Brick color:** **`--brick`** **only** Day-14 No + inline error surfaces (Story 1.2) — **do not** reuse for generic warnings.

### Project Structure Notes

| Artifact | Path |
|----------|------|
| Takeover UI | `src/components/audiblytics/Day14Takeover.tsx` |
| Player | `src/components/audiblytics/CompositePlayer.tsx` |
| Binary buttons | `src/components/audiblytics/ButtonPair.tsx` |
| FR38 resolver | `src/features/day14/select-day-1-recording.ts` |
| Trigger (consume) | `src/features/day14/use-day-14-trigger.ts` |
| Gate (mount) | `src/app/_internal/Day14Gate.tsx` |

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 7, Story 7.3]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — § components tree, § FR37–FR40 mapping, `next/dynamic` note]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` — § Day14Takeover, § CompositePlayer, § ButtonPair, Flow J3]
- [Source: `_bmad-output/implementation-artifacts/7-2-day-14-gate-at-layout-level-url-unbypassable.md` — gate/takeover split]
- [Source: `_bmad-output/implementation-artifacts/3-5-compare-any-two-recordings-via-compositeplayer-general-purpose-mode.md` — compare contract]

### Previous story intelligence (Story 7.2)

- **`Day14Gate`** returns **only** takeover when **`trigger === true`**; **`'no-recording'`** flows **normal shell** — banner must land in **Today** route, not gate.
- Lazy import **`@/components/audiblytics/Day14Takeover`** — this story replaces any **thin placeholder** with real UI.

### Git intelligence summary

Repository history unavailable in this environment — rely on story files + planning artifacts above.

### Latest technical specifics

Skipped per execution constraints — follow locked **`next/dynamic`**, Dexie **`useLiveQuery`**, and shadcn/Radix Dialog patterns in **`architecture.md`**.

### Project context reference

No `project-context.md` found in workspace glob — use **`architecture.md`**, **`ux-design-specification.md`**, and this story as primary sources.

## Dev Agent Record

### Agent Model Used

claude-4.6-sonnet-medium-thinking (auto-sprint)

### Completion Notes List

- `selectDay1Recording`: same-word via normalized `hardWords` + paragraphCache; tie-break newest B, then earliest A; fallback earliest/latest by `recordingDate`.
- `Day14Takeover`: `@base-ui/react/dialog` fullscreen `bg-surface`, `disablePointerDismissal`, `onOpenChange` → `cancel()` for Esc; no close; `h1` via `Title` + `render`; row previews + `CompositePlayer`; `ButtonPair` hidden until playback; fade via rAF + `transition-opacity duration-[400ms]`; Yes stub focus.
- Today `page.tsx`: `useDay14Trigger`, banner when `no-recording` + paragraph, `#record-panel-region` scroll/focus.
- `CompositePlayer`: optional `className`, `playLabel`.
- Tests: `pickSameWordPair` (50/50).

### File List

- `src/features/day14/select-day-1-recording.ts`
- `src/features/day14/select-day-1-recording.test.ts`
- `src/components/audiblytics/ButtonPair.tsx`
- `src/components/audiblytics/Day14Takeover.tsx`
- `src/components/audiblytics/CompositePlayer.tsx`
- `src/app/page.tsx`

---

**Completion note:** Ultimate context engine analysis completed — comprehensive developer guide created.
