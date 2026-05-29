# Story 5.3: Optional Recording per Warm-Up Pass

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Priyank,
I want a small "Record this pass" affordance during the warm-up so that I can capture either or both passes via the same Voice Journal pipeline,
so that warm-up audio can be reviewed alongside paragraph recordings if I choose.

## Acceptance Criteria

1. **Opt-in affordance (FR46, UX warm-up non-blocking)** — Given `<WarmUpDrill>` is mounted and the user is in an **active drill phase** (with-pen pass, `transition` if shown as a distinct UI phase, **or** without-pen pass per Story 5.2 state machine), when they inspect the panel, then a compact **“● Record this pass”** control is visible; it is **never required** to finish the drill — timers, **“Back to today’s paragraph,”** and in-component exit behave as in Story 5.2 without forcing recording. [Source: `_bmad-output/planning-artifacts/epics.md` Story 5.3; PRD FR46–FR47]

2. **Recorder seam (AR20 / Epic 3)** — Given the user activates the record affordance, when capture runs, then **all** microphone / `MediaRecorder` usage goes through `createRecorder()` from `src/lib/audio/recorder.ts` (same factory as `RecordPanel` / Epic 3 Story 3.1); **no** raw `getUserMedia` / `MediaRecorder` outside that module. Respect the wrapper’s MIME auto-detect, permission lifecycle, and **60s cap** (warm-up segments are 30s — still within cap). [Source: `_bmad-output/planning-artifacts/architecture.md`; `_bmad-output/implementation-artifacts/3-3-recordpanel-capture-persist-and-stamp-dayofuse.md`]

3. **Dexie persistence + warm-up identity** — Given a warm-up recording is finalized (stop or error-handled completion), when it is written to IndexedDB, then the row matches `recording.schema.ts` / `VoiceRecording` shape and sets **`paragraphId`** to a stable warm-up key such as **`warmup-<phrase-hash>`** where `<phrase-hash>` is derived deterministically from the **current session’s tongue-twister string** (same phrase across both passes — hash once per mount). Include normal fields: `recordingDate` (ISO), `mimeType`, `blob`, `durationMs`, `dayOfUse` stamped via the **same** `distinctDaysOfUse()` + `recordDayOfUse()` pathway as paragraph recordings (Story 3.3). If **both** passes are recorded, **two** rows are inserted (same `paragraphId` prefix pattern is acceptable if timestamps differ; if list UX cannot distinguish same-id collisions, encode pass in the id string per architecture-friendly pattern, e.g. suffix `-pen` / `-nop`, **without** breaking Zod schema — extend schema only if architecture already allows optional metadata). [Source: epics Story 5.3; architecture Dexie `recordings` table]

4. **Voice Journal list (FR35)** — Given one or two warm-up recordings were saved, when the user opens the Voice Journal route, then **each** appears in the list **alongside** paragraph recordings, with a **clear visual indicator** that the row is warm-up (not today’s paragraph read). Paragraph-derived rows remain unchanged. [Source: epics Story 5.3; `_bmad-output/planning-artifacts/architecture.md` `use-recordings.ts` / `VoiceJournalList`]

5. **No scoring (FR47)** — Given any warm-up recording path, when the UI renders, then **no** scores, stars, rubrics, or quality judgments appear for the drill or the saved clip (recording is capture-only). [Source: epics Story 5.1–5.3 FR47]

## Tasks / Subtasks

- [ ] ** Preconditions** (AC: all)
  - [ ] Confirm Story **5.2** behaviors: without-pen timer, exits, focus restore — **remove or supersede** Story 5.2’s “Scope boundary (Story 5.3)” checklist items in implementation notes once this lands.
  - [ ] Confirm Story **3.3** `use-save-recording` (or equivalent) exists; otherwise implement persistence helper per Story 3.3 before wiring warm-up.

- [ ] **WarmUpDrill UI + a11y** (AC: 1, 5)
  - [ ] In `src/components/audiblytics/WarmUpDrill.tsx`, add **“● Record this pass”** as a **secondary** control (small text / subtle — does not compete with timer or primary exit).
  - [ ] Show the affordance during **both** with-pen and without-pen active phases (and during `transition` only if that state remains visible long enough to matter; if `transition` is instant, document “N/A” in Dev Agent Record).
  - [ ] Ensure keyboard and SR: control has a clear name, e.g. `aria-pressed` or live region updates only per existing Voice Journal patterns — **no** spamming `aria-live` beyond Story 5.1/5.2 timer announcements.

- [ ] **Recording orchestration** (AC: 2, 3)
  - [ ] Prefer reusing **`src/features/voice-journal/use-recording-state-machine.ts`** patterns from `RecordPanel` (idle → requesting → recording → stopped) **or** a thin warm-up-specific hook that **still** calls `createRecorder()` and the **same** save entry point as paragraph flows.
  - [ ] On stop: call shared save path with `{ blob, mimeType, durationMs, paragraphId: 'warmup-<phrase-hash>…' }` per AC3.
  - [ ] **Concurrent with timers:** recording must **not** reset or cancel the 30s pass timers unless product-intent says otherwise; default — **parallel** (user may record a subset of the 30s).

- [ ] **VoiceJournalList / row chrome** (AC: 4)
  - [ ] Update list row component used by `VoiceJournalList` to detect warm-up rows (`paragraphId` prefix `warmup-` or agreed convention) and show a **mono** or **badge** label such as “Warm-up” distinct from paragraph titles.

- [ ] **Failure handling** (AC: 2–3)
  - [ ] Mic denied / storage quota: follow **RecordPanel** / **InlineErrorSurface** patterns from Story 3.3 (no silent loss; optional in-memory retry for failed Dexie writes).

- [ ] **Manual verification** (NFR26)
  - [ ] Record **with-pen only**, exit — one warm-up row in Voice Journal.
  - [ ] Record **both** passes — **two** rows, both labeled warm-up.
  - [ ] Complete drill **without** recording — no errors; timers and exit match Story 5.2.
  - [ ] Confirm **FR47**: no new evaluative copy anywhere in warm-up + journal surfaces.

## Dev Notes

### Epic and dependency context

- **Epic 5** delivers pen-drill from Today with optional journal-compatible audio (FR43–FR46). **Depends on 5.1–5.2** for `WarmUpDrill`, state machine, and lazy load. **Depends on Epic 3** for recorder factory and Dexie recordings pipeline.

### Architecture compliance

- **Lazy load:** Keep `WarmUpDrill` behind **`next/dynamic`** on Today (AR22); recording hooks must not force eager loading of unrelated routes.
- **Import direction:** `app/` → `features/` → `components/` → `lib/` (AR18); warm-up feature code stays under `features/warm-up/` and `components/audiblytics/WarmUpDrill.tsx` per tree in `architecture.md`.
- **IndexedDB validation:** All writes validated with Zod before `safeWrite` / Dexie (architecture Data Architecture).
- **Cross-links:** `WarmUpDrill` will compose **`lib/audio/recorder`** + **`features/voice-journal`** persistence — mirror `RecordPanel` composition documented for `RecordPanel` in architecture.

### Technical requirements

- **`paragraphId` convention:** Use prefix `warmup-` so FR38 / Day-14 logic that keys off `paragraphId` can **exclude** warm-up rows where appropriate (verify Day-14 selectors filter real paragraph ids only).
- **Phrase hashing:** Use a short stable hash (e.g. **djb2** or **SHA-256 hex slice**) of the normalized phrase string; avoid rolling new crypto dependency if not already in tree.
- **60s cap:** Recorder wrapper enforces max duration — warm-up clips should stop naturally under 30s; if user keeps recording, wrapper behavior wins (document in QA).

### File Structure Notes

| Area | Path (expected) |
|------|-----------------|
| UI | `src/components/audiblytics/WarmUpDrill.tsx` |
| State | `src/features/warm-up/use-warm-up-state-machine.ts` (optional: `use-warm-up-recording.ts`) |
| Audio | `src/lib/audio/recorder.ts` (READ — no fork) |
| Persist | `src/features/voice-journal/use-save-recording.ts`, `src/lib/schemas/recording.schema.ts`, `src/lib/storage/db.ts` |
| List | `src/components/audiblytics/VoiceJournalList.tsx` (or row child — align to implemented tree) |

### Testing requirements

- **No Vitest/Jest in MVP** (NFR26). Manual matrix under Tasks.

### References

- Epics — Story 5.3: `_bmad-output/planning-artifacts/epics.md`
- PRD — FR35, FR46–FR47: `_bmad-output/planning-artifacts/prd.md`
- Architecture — recorder, Dexie, `features/warm-up/`, `features/voice-journal/`: `_bmad-output/planning-artifacts/architecture.md`
- Prior implementation spec — RecordPanel persistence: `_bmad-output/implementation-artifacts/3-3-recordpanel-capture-persist-and-stamp-dayofuse.md`
- Prior — Story 5.2 (exit + scope handoff): `_bmad-output/implementation-artifacts/5-2-without-pen-pass-transition-and-back-to-today-affordance.md`

### Previous story intelligence (5.2)

- Story 5.2 **explicitly deferred** recording, Dexie warm-up rows, and “Record this pass” to **this** story; implement without breaking timer, **Back to today’s paragraph**, focus restore, or FR47 no-scoring rule.
- Reuse the **same** `phrase` for both passes; warm-up `paragraphId` hashing must use that **session** phrase.

### Latest technical research

Skipped per run directive (no web research). Use locked stack from `architecture.md` / `package.json` when the repo exists.

### Project context reference

`project-context.md` was not found in-repo at story creation time; use `architecture.md` + epics as canonical.

## Dev Agent Record

### Agent Model Used

_(Story context generation — not applicable)_

### Debug Log References

### Completion Notes List

### File List

_(Populated by dev agent during implementation)_

---

**Story completion status:** ready-for-dev — Ultimate context engine analysis completed for Story 5.3 (web research omitted per run constraints; repository source tree not present in workspace — dev agent must read actual files on branch).
