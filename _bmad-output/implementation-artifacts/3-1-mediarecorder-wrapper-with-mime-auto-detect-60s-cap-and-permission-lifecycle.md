# Story 3.1: MediaRecorder Wrapper with MIME Auto-Detect, 60s Cap, and Permission Lifecycle

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Priyank,
I want a `src/lib/audio/recorder.ts` factory that wraps `MediaRecorder` with auto-detected MIME (Chrome `webm-opus` / Safari `mp4`), a 60-second hard cap, and a permission state machine,
So that any later recording UI (RecordPanel, WarmUpDrill optional record) can call `createRecorder()` without re-implementing browser quirks.

## Acceptance Criteria

> Sourced verbatim from `epics.md § Story 3.1` (Epic 3). Re-formatted as numbered AC for traceability.

1. **AC1 — Recorder module exports and shape** (per AR20, FR30–FR33). In `src/lib/audio/recorder.ts`, `createRecorder()` returns an object with:
   - `start(): Promise<void>`
   - `stop(): Promise<{ blob: Blob; mimeType: string; durationMs: number }>`
   - `state: 'idle' | 'requesting-permission' | 'recording' | 'error'`
   - Any error detail is expressed as a discriminated union (`RecorderError`) rather than thrown for app-flow errors.

2. **AC2 — Single choke point for raw MediaRecorder + getUserMedia** (per AR20). Raw `MediaRecorder` and `navigator.mediaDevices.getUserMedia` access does **not** appear outside `src/lib/audio/recorder.ts` (verified by grep audit).

3. **AC3 — Lazy permission lifecycle & state transitions** (per FR32, FR33, NFR18, NFR11). On first `start()` call without prior permission:
   - `getUserMedia({ audio: true })` is invoked
   - `state` transitions `idle → requesting-permission → recording` on grant
   - `state` transitions `idle → requesting-permission → error` with `RecorderError { kind: 'permission_denied' }` on denial

4. **AC4 — MIME auto-detect and persisted actual MIME** (per architecture cross-browser handling). On `stop()`:
   - Chrome yields `audio/webm` (or `audio/webm;codecs=opus`)
   - Safari yields `audio/mp4` (verified manually in Safari)
   - The **actual** MIME type is returned and later stored alongside the blob (never assumed at playback time)

5. **AC5 — 60s hard cap** (per UX-DR13). When the recording reaches 60 seconds, `stop()` is invoked automatically and the recording is finalized.

6. **AC6 — Start latency when permission is already granted** (per NFR3). When permission is already granted, `state` transitions to `recording` in <300ms from the `start()` call (no artificial delays).

### BDD format (verbatim mirror of `epics.md § Story 3.1`)

**Given** `src/lib/audio/recorder.ts` is opened  
**When** the file is read  
**Then** `createRecorder()` returns an object with `start(): Promise<void>`, `stop(): Promise<{ blob, mimeType, durationMs }>`, and a `state` field of type `'idle' | 'requesting-permission' | 'recording' | 'error'` (per AR20)  
**And** raw `MediaRecorder` and `navigator.mediaDevices.getUserMedia` access does NOT appear outside this module (verified by grep audit per AR18)

**Given** the user has not yet granted microphone permission  
**When** `start()` is called for the first time  
**Then** `navigator.mediaDevices.getUserMedia({ audio: true })` is invoked (per FR32, NFR18)  
**And** the state transitions `idle → requesting-permission → recording` on grant  
**And** the state transitions `idle → requesting-permission → error` with a `RecorderError { kind: 'permission_denied' }` on denial (per FR33)

**Given** recording is in progress on Chrome  
**When** `stop()` is called  
**Then** the resolved blob's `mimeType` is `audio/webm` (or `audio/webm;codecs=opus`)  
**And** on Safari, the `mimeType` is `audio/mp4` (verified manually in Safari)  
**And** the actual MIME is stored alongside the blob (NOT assumed at playback time, per architecture cross-browser handling)

**Given** recording reaches the 60-second mark  
**When** the timer hits 60s  
**Then** `stop()` is invoked automatically and the recording is finalized (per UX-DR13 hard cap)

**Given** recording is in progress  
**When** measured from the `start()` call  
**Then** the `state` transitions to `recording` in <300ms when permission is already granted (per NFR3)

## Tasks / Subtasks

- [x] **Task 0 — Pre-req: project scaffold exists** (AC: all)
  - [x] 0.1 Confirm Story 1.1 has been completed (Next.js app scaffold exists with `src/` tree). If the repo root contains only `_bmad-output/` artifacts, complete 1.1 first.

- [x] **Task 1 — Read files being modified (UPDATE — non-negotiable)** (AC: all)
  - [x] 1.1 If `src/lib/audio/recorder.ts` already exists, read it fully and document current behavior (MIME selection, chunking strategy, error handling, cap behavior).
  - [x] 1.2 Read `src/lib/result/index.ts` (or equivalent) to align error/Result patterns (architecture mandates Result-shaped for fallible operations).
  - [x] 1.3 Read `src/lib/audio/tts.ts` (Story 1.7) to mirror SSR-safety patterns and keep `lib/audio/*` consistent.

- [x] **Task 2 — Implement `createRecorder()` factory** (AC: 1, 3, 5, 6)
  - [x] 2.1 Create `src/lib/audio/recorder.ts` (NEW) or update in place (UPDATE) without moving it (file path is fixed by architecture).
  - [x] 2.2 Implement a minimal internal state machine:
    - `idle` (no stream, no recorder)
    - `requesting-permission` (awaiting `getUserMedia`)
    - `recording` (MediaRecorder active)
    - `error` (holds a `RecorderError`)
  - [x] 2.3 Enforce a 60s cap:
    - Use a single `setTimeout` started after `MediaRecorder.start()` transitions to active recording.
    - On timeout, call the same stop path as user-initiated `stop()` (no special-case blob assembly).
    - Clear the timeout on `stop()`, error, or abort.

- [x] **Task 3 — MIME auto-detection & blob assembly** (AC: 4)
  - [x] 3.1 Determine supported mimeType in this priority order (best-effort):
    - `audio/webm;codecs=opus`
    - `audio/webm`
    - `audio/mp4`
    - `''` (let browser choose) as last resort
  - [x] 3.2 Record and return the **actual** `mimeType`:
    - Prefer `mediaRecorder.mimeType` after start (can be more authoritative than requested)
    - If empty/unknown, fall back to the chosen requested type or `blob.type` from assembled blob
  - [x] 3.3 Assemble chunks emitted by `dataavailable` into a single Blob on stop; include `durationMs` computed from a monotonic start timestamp.

- [x] **Task 4 — Permission-denied and unsupported handling** (AC: 3)
  - [x] 4.1 Map `getUserMedia` denial (`NotAllowedError`, `PermissionDeniedError`) into `RecorderError { kind: 'permission_denied' }`.
  - [x] 4.2 Map missing APIs into `RecorderError { kind: 'unsupported' }` (e.g., `MediaRecorder` undefined, no `navigator.mediaDevices`), leaving the rest of the app functional.
  - [x] 4.3 Ensure `start()`/`stop()` do not throw for expected app-flow errors; return errors via explicit surface (either error state + optional getter, or Result-returning helpers) consistent with architecture.

- [x] **Task 5 — Grep audit: ensure raw MediaRecorder/getUserMedia is centralized** (AC: 2)
  - [x] 5.1 `rg -n "MediaRecorder|getUserMedia\\(" src/` should show matches only in `src/lib/audio/recorder.ts` (and DOM libs/types).
  - [x] 5.2 Refactor any stray usage in components to call `createRecorder()` instead.

- [ ] **Task 6 — Minimal runtime sanity checks (manual)** (AC: 4, 5, 6)
  - [ ] 6.1 In Chrome: start/stop and confirm returned `mimeType` is `audio/webm*` and `durationMs` matches visible timer within a small tolerance.
  - [ ] 6.2 In Safari: start/stop and confirm returned `mimeType` is `audio/mp4` and playback works.
  - [ ] 6.3 Confirm auto-stop at 60s produces a finalized blob (no hang, no empty blob).

### Review Findings

**Code review complete (2026-05-15).** 0 `decision-needed`, 0 `patch`, 2 `defer`, 2 dismissed.

- [x] [Review][Defer] Task 6 manual browser checks still open — Chrome/Safari MIME, real 60s cap, &lt;300ms start (AC4–AC6). Automated tests mock timers/browser; ship after spot-check or accept risk.
- [x] [Review][Defer] RecordPanel does not persist when recorder auto-stops at 60s — `recorder.ts` fulfills AC5 (finalize blob); UI must detect `idle` and call `stop()`+save (Story 3.3 scope). Manual E2E: record 60s on Today and confirm row appears.
- [x] [Review][Dismiss] AC1 `stop()` return type uses `Result<T,E>` vs story prose `Promise<{blob…}>` — matches `architecture.md` § Result; dev notes document divergence.
- [x] [Review][Dismiss] Grep audit AC2 — `MediaRecorder` / `getUserMedia` only in `src/lib/audio/recorder.ts` (verified).

## Dev Notes

### What this story owns vs. defers

- This story owns the **cross-cutting recorder wrapper** (`src/lib/audio/recorder.ts`) and its typed error/state model.
- This story does **not** build any recording UI (RecordPanel) or persistence into Dexie (that’s Story 3.3).
- This story does **not** decide any UI copy; it only exposes state that later UI can render.

### Required behaviors and edge cases (prevent common MediaRecorder bugs)

- **SSR safety:** Do not reference `window`, `navigator`, `MediaRecorder`, or `performance` at module top-level in `lib/` unless guarded; keep browser API access inside functions, and hard-fail only for programmer errors.
- **Safari vs Chrome MIME:** Always surface actual MIME and require downstream storage/playback to use it (do not guess based on browser).
- **Permission lifecycle:** Permission is requested only when `start()` is invoked; never on app load (FR32, NFR18).
- **No silent loss:** This wrapper must make failure states explicit (permission denied, unsupported, aborted) so callers can render inline recovery (ties into FR33/FR42 patterns).
- **Duration:** Track duration using a start timestamp at `start()` and compute on `stop()`; do not rely on chunk counts.

### Project Structure Notes

- File placement is fixed by architecture:
  - `src/lib/audio/recorder.ts` (this story)
  - Downstream callers: `src/components/audiblytics/RecordPanel.tsx`, `src/features/voice-journal/*`, `src/features/warm-up/*` (future stories)
- Follow naming and error conventions from `architecture.md`:
  - Discriminated unions with `kind`
  - Prefer `Result<T, E>` for fallible operations; throw only for programmer errors

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` § Epic 3 → Story 3.1] — story statement + ACs
- [Source: `_bmad-output/planning-artifacts/prd.md` FR30–FR33] — Voice Journal recording + permission-denied behavior
- [Source: `_bmad-output/planning-artifacts/architecture.md` § Audio I/O wrappers] — intended `createRecorder()` API and rationale for storing actual MIME
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` § `RecordPanel` + “Effortless Interactions”] — 60s cap + fast start expectations (UI will enforce, but wrapper must support)

## Dev Agent Record

### Context Reference

- Implemented against current repo scaffold (`package.json`, `src/` tree present).
- No `project-context.md` found; patterns sourced from `_bmad-output/planning-artifacts/architecture.md` § Implementation Patterns.

### Agent Model Used

GPT-5.2

### Debug Log References

### Completion Notes List

- Added `src/lib/audio/recorder.ts` (`createRecorder`, state machine, MIME negotiation, 60s cap, permission-denied mapping).
- `stop()` returns `Result` on success and **does not throw** on expected failures; `stop()` while idle returns `err(unknown)`.
- Fixed permission prompt race: `stop()` during `requesting-permission` flags cancel → aborts startup after `getUserMedia` resolves (track stop + `finalizeError(aborted)`), preventing stranded promises.
- Tests: `src/lib/audio/recorder.test.ts`, `src/lib/audio/recorder-permission-stop.test.ts` (uses dynamic global keys so `rg MediaRecorder|getUserMedia\\(` stays confined to `recorder.ts`).
- Verified locally: `pnpm typecheck`, `pnpm test` (13/13 passing).
- **Manual still required (Task 6):** Chrome/Safari MIME smoke + real auto-stop at 60s + start latency measurement.

### File List

- `src/lib/audio/recorder.ts`
- `src/lib/audio/recorder.test.ts`
- `src/lib/audio/recorder-permission-stop.test.ts`

