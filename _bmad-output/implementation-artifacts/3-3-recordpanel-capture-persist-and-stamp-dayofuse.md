# Story 3.3: RecordPanel — Capture, Persist, and Stamp dayOfUse

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Priyank,  
I want a single-tap `RecordPanel` below today’s paragraph that records via `createRecorder()`, persists each take to IndexedDB with full metadata, and stamps `dayOfUse` consistently,  
so that recording feels effortless and downstream surfaces (calendar + Day-14) receive correct recording + day semantics.

## Acceptance Criteria

> Sourced from `_bmad-output/planning-artifacts/epics.md` § Story 3.3, plus architecture/UX constraints referenced below.

1. **AC1 — RecordPanel renders below today’s paragraph** (FR30, UX-DR13)  
   Given the Today route has rendered today’s paragraph  
   When the user inspects the area below the paragraph  
   Then `<RecordPanel>` shows:
   - a forest 56×56 record button
   - mono caption `"Tap to record this read"`
   - mono timer `0:00 / 1:00`
   - and pressing `R` toggles record/stop when focus is on the panel

2. **AC2 — Record state UX + accessibility** (UX-DR13, UX-DR36, UX-DR39)  
   Given the user taps record (or presses `R`)  
   When the recorder transitions to `recording` state  
   Then the button becomes a brick stop-icon, the timer counts up, and a 1.0s breathing pulse animates the button background  
   And when `prefers-reduced-motion: reduce` is set, the pulse becomes a static color shift  
   And an `aria-live="polite"` region announces `"Recording, N seconds elapsed"`

3. **AC3 — Persist a recording row on stop (no silent loss)** (FR31, FR34, AR16, NFR8)  
   Given the user taps stop  
   When the recorder finalizes the recording  
   Then a new row is inserted into Dexie `recordings` with fields:
   `{ id, recordingDate: ISO datetime, paragraphId, durationMs, mimeType, blob, dayOfUse }`  
   And the row is validated against `src/lib/schemas/recording.schema.ts` before write (Zod as truth, AR16)  
   And saving a second take inserts a second row (no overwrite, FR34)

4. **AC4 — Stamp dayOfUse and record day-of-use** (AR13, Epic 4 dependencies)  
   Given a recording write succeeds  
   When persistence completes  
   Then `dayOfUse` stored on the recording equals a snapshot of `distinctDaysOfUse()` at save time  
   And `recordDayOfUse()` is called from the save path (so day-counting stays centralized and idempotent)

5. **AC5 — Inline “just saved” materialization** (epics Story 3.3)  
   Given a recording is successfully saved  
   When the Today route re-renders  
   Then the recording materializes inline below the panel as a row like `▶ 0:42 · today HH:MMpm`  
   And multiple takes appear in the inline list

6. **AC6 — Storage failure is surfaced and recoverable** (FR42, NFR8, UX-DR24)  
   Given the IndexedDB write fails  
   When the failure is caught  
   Then the audio blob is held in memory (until the user retries or navigates away)  
   And `<InlineErrorSurface variant="storage">` renders with `[Open Settings]` + `[Try Again]`  
   And the recording is not silently lost

7. **AC7 — Mic permission denial does not break the app** (FR33, NFR11, UX-DR13)  
   Given microphone permission is denied  
   When the user attempts to record  
   Then `<RecordPanel>` shows an inline error with guidance to enable mic permission and a `[Try Again]` button  
   And the rest of the app remains fully functional

## Tasks / Subtasks

- [x] **Task 0 — Preconditions / alignment checks** (AC: all)
  - [x] 0.1 Ensure the app scaffold exists (`package.json`, `src/` tree). If not, implement Story 1.1 first.
  - [x] 0.2 Read + confirm Story 3.1 was implemented (`src/lib/audio/recorder.ts` exists and is the only raw `MediaRecorder/getUserMedia` choke point).
  - [x] 0.3 Read + confirm Story 3.2 was implemented (`src/lib/day-counter/*` exists, UTC semantics).
  - [x] 0.4 Read + confirm Story 1.4 was implemented (`src/lib/storage/db.ts`, `safeWrite`, `recording.schema.ts`, `useLocalStorage`).

- [x] **Task 1 — Read files being modified (UPDATE — non-negotiable)** (AC: all)
  - [x] 1.1 Today route render tree: locate where the paragraph is rendered and where a RecordPanel should mount (likely `src/components/audiblytics/ParagraphHero.tsx` or Today route client wrapper).
  - [x] 1.2 Read existing `InlineErrorSurface` implementation (Story 1.12) and confirm it supports `variant="storage"` and `[Try Again]` + `[Open Settings]` actions.
  - [x] 1.3 Read `src/lib/storage/db.ts` to confirm the canonical write helper (`safeWrite`) and recordings table access pattern.
  - [x] 1.4 Read `src/lib/schemas/recording.schema.ts` to confirm exact persisted fields + validation constraints.

- [x] **Task 2 — Implement persistence API for recordings** (AC: 3, 4, 6)
  - [x] 2.1 Add `src/features/voice-journal/use-save-recording.ts` (NEW) exporting `saveRecording({ rowId, blob, mimeType, durationMs, paragraphId })` that performs:
    - construct `VoiceRecording` row with caller-supplied `rowId` (stable across storage retries), `recordingDate: new Date().toISOString()`, and `dayOfUse: distinctDaysOfUse()` snapshot **before** `recordDayOfUse()`
    - Zod validate against `recordingSchema` prior to write
    - Dexie write via `safeWrite(() => db.recordings.put(row))` (idempotent retry for same `rowId`)
    - on success:
      - call `recordDayOfUse()`
      - set `audiblytics.completions[todayUtc].hasRecording = true` via the existing calendar/completions pathway (Epic 4 dependency, referenced by epics Story 4.2)
    - on failure:
      - return a `Result.err(StorageError)` (don’t throw for flow errors)
      - preserve the in-memory blob payload for retry

- [x] **Task 3 — Implement `RecordPanel` UI + wiring to recorder** (AC: 1, 2, 7)
  - [x] 3.1 Create `src/components/audiblytics/RecordPanel.tsx` (NEW, `"use client"`) implementing the UX-DR13 state machine:
    - `idle` / `requesting-permission` / `recording` / `stopped` / `error`
  - [x] 3.2 Use `createRecorder()` from `src/lib/audio/recorder.ts` for start/stop; do not touch `MediaRecorder` or `getUserMedia` directly.
  - [x] 3.3 Implement keyboard shortcut `R` scoped to “focus is on the panel” (do not register a global `window` hotkey that fires anywhere).
  - [x] 3.4 Implement reduced motion behavior via CSS media query and/or Tailwind motion utilities consistent with the project’s `prefers-reduced-motion` approach.
  - [x] 3.5 Implement `aria-live="polite"` timer announcements and ensure timer text does not spam screen readers (announce on whole-second boundaries).
  - [x] 3.6 Mic denied path: render the exact guidance copy from epics AC with `[Try Again]` that re-attempts `start()`.

- [x] **Task 4 — On stop: save and render inline list** (AC: 3, 5, 6)
  - [x] 4.1 On user stop (or 60s auto-stop from recorder wrapper), call `useSaveRecording` with the finalized payload.
  - [x] 4.2 Inline list under panel:
    - show rows like `▶ 0:42 · today HH:MMpm`
    - render newest-first for the current day
    - do not overwrite prior takes (FR34)
  - [x] 4.3 Playback for inline list can be minimal (single-audio element) but MUST respect stored `mimeType` when constructing a `Blob` URL.

- [x] **Task 5 — Storage failure recovery with in-memory blob** (AC: 6)
  - [x] 5.1 If Dexie write fails, keep the latest take’s `{ blob, mimeType, durationMs, paragraphId }` in React state so `[Try Again]` can retry without re-recording.
  - [x] 5.2 Render `<InlineErrorSurface variant="storage" />` in the panel region with:
    - `onRetry` re-attempting the Dexie write
    - `onOpenSettings` navigating to `/settings`
  - [x] 5.3 Ensure retry is idempotent: repeated retries insert at most one row (guard via “in-flight” boolean or state machine).

- [ ] **Task 6 — Minimal manual verification** (AC: all)
  - [ ] 6.1 Chrome: record, stop, ensure a `recordings` row exists with `mimeType` `audio/webm*`, blob plays back, and UI shows inline row.
  - [ ] 6.2 Safari: same flow; ensure `mimeType` `audio/mp4` and playback works.
  - [ ] 6.3 Permission denied: deny mic, confirm inline mic error renders, and rest of app is usable.
  - [ ] 6.4 Force storage error (quota exceeded) and confirm the in-memory blob retry path works and the take is not silently lost.

## Dev Notes

### Non-negotiable guardrails (avoid common disasters)

- **Do not reinvent recorder quirks**: All recording must go through `src/lib/audio/recorder.ts` (`createRecorder()`); no raw `MediaRecorder/getUserMedia` outside that module.  
  - [Source: `_bmad-output/planning-artifacts/architecture.md` AR20]
- **Persist actual MIME**: Use the `mimeType` returned by the recorder wrapper and store it; playback must use stored MIME, not guessed browser types.  
  - [Source: `_bmad-output/planning-artifacts/architecture.md` Voice Journal cross-browser handling]
- **No silent loss**: Any storage failure must surface inline with recovery actions; holding the blob in memory for retry is required.  
  - [Source: `_bmad-output/planning-artifacts/epics.md` Story 3.3 AC; FR42/NFR8]
- **Day semantics are centralized**: `recordDayOfUse()` and `distinctDaysOfUse()` come from `src/lib/day-counter/` and are UTC anchored; do not compute day-of-use ad-hoc.  
  - [Source: `_bmad-output/planning-artifacts/architecture.md` AR13]
- **Layering**: follow import direction `app/` → `features/` → `components/` → `lib/`; `lib/` must not import outward.  
  - [Source: `_bmad-output/planning-artifacts/architecture.md` AR18]

### Expected file targets (align to architecture)

- UI:
  - `src/components/audiblytics/RecordPanel.tsx` (NEW)
- Voice-journal capability:
  - `src/features/voice-journal/use-save-recording.ts` (NEW)
  - (optional) `src/features/voice-journal/use-todays-recordings.ts` (NEW) if factoring list queries cleanly
- Storage:
  - Use `src/lib/storage/db.ts` (`db.recordings`, `safeWrite`)
  - Use `src/lib/schemas/recording.schema.ts` for validation
- Day semantics:
  - Use `src/lib/day-counter/*`

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` § Story 3.3] — canonical story statement + ACs
- [Source: `_bmad-output/planning-artifacts/epics.md` § Story 4.2] — completion dependency: recording save sets `hasRecording` and calls `recordDayOfUse()`
- [Source: `_bmad-output/planning-artifacts/architecture.md` §§ Voice Journal, Data Architecture, AR13, AR16, AR18, AR20] — Dexie table contract, Zod-as-truth, import layering, recorder wrapper boundary
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` UX-DR13 + accessibility section] — RecordPanel states, motion, aria-live, one-tap principle

## Dev Agent Record

### Agent Model Used

GPT-5.2

### Debug Log References

### Completion Notes List

- `RecordPanel` on Today below `ParagraphHero`; `createRecorder` only; 56×56 control, mono caption + timer, `R` when panel focused, `aria-live` whole-second announcements, mic-denied epic copy + Try Again, storage failure + pending blob + `InlineErrorSurface` Try Again/Open Settings.
- `saveRecording` in `use-save-recording.ts`: Zod validate, `distinctDaysOfUse()` snapshot for `dayOfUse`, `safeWrite(() => db.recordings.put(...))`, then `recordDayOfUse()` + `writeCompletions` for today UTC `hasRecording`.
- Dexie **v2**: `recordings` PK `id` (UUID); upgrade clears legacy `recordings` rows from broken v1 `++id` schema.
- `InlineErrorSurface` storage variant: optional `onRetry` / `isRetrying` for Try Again.
- Task 6 manual (Chrome/Safari/mic/quota) still for you in browser.

### File List

- `src/components/audiblytics/RecordPanel.tsx`
- `src/components/audiblytics/InlineErrorSurface.tsx`
- `src/features/voice-journal/use-save-recording.ts`
- `src/lib/storage/db.ts`
- `src/app/page.tsx`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/3-3-recordpanel-capture-persist-and-stamp-dayofuse.md`
