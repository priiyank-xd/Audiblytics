# Story 1.7: Browser TTS Wrapper with Voice Lifecycle Handling

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Priyank,
I want a `src/lib/audio/tts.ts` wrapper that handles Chrome's asynchronous voice loading, Safari's smaller voice set, voice-selection persistence, and graceful fallback to system default,
So that any later TTS-using component (HardWordRow, paragraph play, Daily Review) can call `speak(text)` without re-implementing the lifecycle.

## Acceptance Criteria

> Sourced verbatim from `epics.md § Story 1.7` (lines 599–628). Re-formatted as numbered AC for traceability.

1. **AC1 — TTS module exports exist** (per AR20, FR22–FR25). In `src/lib/audio/tts.ts`, export:
   - `useVoices(): SpeechSynthesisVoice[]`
   - `speak(text: string, voice?: SpeechSynthesisVoice): void`
   - `getPersistedVoice(): SpeechSynthesisVoice | null`

2. **AC2 — Single choke point for raw SpeechSynthesis** (per AR20). Raw `speechSynthesis` access does not appear outside `src/lib/audio/tts.ts` (verified by grep audit).

3. **AC3 — Chrome async voice lifecycle handled** (per FR24). In Chrome, when voices are not initially loaded, `useVoices()` initially returns `[]` and then triggers a re-render when the `voiceschanged` event fires, exposing the populated voice list.

4. **AC4 — Persisted voice fallback** (per FR25). If the user previously selected a voice that is no longer available (e.g., switched browsers), `speak(text)` falls back to the system default English voice.

5. **AC5 — Voice picker “Loading voices…” state is possible** (per FR24, UX spec). If Settings renders a voice picker while voices are still loading, it can show a “Loading voices…” caption and auto-refresh when voices arrive. (This story provides the `useVoices()` behavior that makes that possible; Settings UI ships in Story 1.9.)

6. **AC6 — TTS start latency is effectively instant** (per NFR4). When a play action calls `speak(text)`, playback begins in <100ms under normal conditions (no artificial delays/spinners).

### BDD format (verbatim mirror of `epics.md § Story 1.7` lines 607–627)

**Given** `src/lib/audio/tts.ts` is opened  
**When** the file is read  
**Then** `useVoices(): SpeechSynthesisVoice[]`, `speak(text: string, voice?: SpeechSynthesisVoice): void`, and `getPersistedVoice(): SpeechSynthesisVoice | null` are exported (per AR20)  
**And** raw `speechSynthesis` access does NOT appear outside this module (verified by grep audit)

**Given** the user opens the app in Chrome with no voices initially loaded  
**When** `useVoices()` first returns  
**Then** the hook re-renders when the `voiceschanged` event fires and exposes the populated voice list (per FR24)

**Given** the user previously selected a voice that is no longer available (e.g., switched browsers)  
**When** the app calls `speak(text)`  
**Then** playback uses the system default English voice (per FR25)

**Given** the user opens Settings voice picker and the voices are still loading  
**When** the picker first renders  
**Then** a "Loading voices…" caption appears in the picker (per FR24)  
**And** the picker auto-refreshes when voices arrive

**Given** TTS playback is triggered  
**When** the user taps a play action  
**Then** playback begins in <100ms (per NFR4)

## Tasks / Subtasks

- [x] **Task 0 — Pre-req: project scaffold exists** (AC: all)
  - [x] 0.1 Confirm Story 1.1 has been completed (Next.js app scaffold exists with `src/` tree). If the repo root contains only `_bmad-output/` artifacts, complete 1.1 first.

- [x] **Task 1 — Read files being modified (UPDATE — non-negotiable)** (AC: all)
  - [x] 1.1 If `src/lib/audio/tts.ts` already exists, read it fully and document current behavior (voice load handling, persistence lookup, cancellation behavior).
  - [x] 1.2 Read `src/lib/storage/use-local-storage.ts` (or equivalent storage wrapper) to confirm the project rule that raw `localStorage` access is centralized there (architecture.md lines 612–626).
  - [x] 1.3 Read `src/lib/schemas/settings.schema.ts` to confirm where `voiceURI` is persisted (expected: `audiblytics.settings.voiceURI`, per architecture.md line 620 and PRD FR8/FR25).

- [x] **Task 2 — Implement `src/lib/audio/tts.ts` wrapper** (AC: 1, 3, 6)
  - [x] 2.1 Create the file at `src/lib/audio/tts.ts` if missing (NEW), or update it in-place (UPDATE).
  - [x] 2.2 Implement `useVoices()`:
    - Returns a `SpeechSynthesisVoice[]`.
    - Subscribes to `speechSynthesis.onvoiceschanged` (or `addEventListener('voiceschanged', ...)` where supported) and triggers state update to cause rerender.
    - On mount, attempts `speechSynthesis.getVoices()` once; if it returns empty, keep `[]` until the event fires.
    - Cleans up listener on unmount.
    - Is SSR-safe (does not reference `window` during module evaluation; guard inside hook/effects).
  - [x] 2.3 Implement `speak(text, voice?)`:
    - Cancels any in-flight utterance before starting a new one (`speechSynthesis.cancel()`).
    - Creates `SpeechSynthesisUtterance(text)` and assigns a voice if one is provided and available.
    - Keeps the call synchronous and “instant” (no async waits; no timeouts).
  - [x] 2.4 Implement a small helper to choose a voice:
    - If `voice` is provided, prefer it.
    - Else prefer `getPersistedVoice()` when it resolves to an available voice.
    - Else fall back to a reasonable default voice from the current list (prefer English voices; otherwise use `speechSynthesis.getVoices()[0]`).
    - If no voices are available yet, still call `speechSynthesis.speak(utterance)`; the browser will pick a default when voices load (best-effort behavior).

- [x] **Task 3 — Implement persisted voice lookup + fallback behavior** (AC: 4)
  - [x] 3.1 Implement `getPersistedVoice()` so it:
    - Reads persisted `voiceURI` from the settings store (expected `audiblytics.settings.voiceURI`).
    - Returns the matching `SpeechSynthesisVoice` from `speechSynthesis.getVoices()` if present.
    - Returns `null` if the key is absent, invalid, or the voice is not in the current browser’s voice list.
  - [x] 3.2 **LocalStorage access rule:** Do not add raw `localStorage.getItem` calls inside arbitrary modules. If a non-React read helper does not exist yet, add it **inside** the existing storage wrapper module (the one permitted to touch localStorage), and call that helper from `getPersistedVoice()`.

- [x] **Task 4 — Grep audit: ensure raw SpeechSynthesis is centralized** (AC: 2)
  - [x] 4.1 `rg -n "speechSynthesis|SpeechSynthesisUtterance" src/` should show matches only in `src/lib/audio/tts.ts` (and in type defs/DOM libs none).
  - [x] 4.2 If any component/hook uses raw `speechSynthesis`, refactor it to call `speak()` / `useVoices()` instead.

- [x] **Task 5 — Typecheck + minimal runtime sanity** (AC: 1, 3, 6)
  - [x] 5.1 Run `pnpm tsc --noEmit` and ensure it exits 0.
  - [x] 5.2 Run `pnpm dev`, open the app, and (if any screen already renders a TTS button) verify that tapping it triggers audible speech and the icon can respond immediately (icon state itself is owned by the caller; this story only ensures the underlying call is instant).

## Dev Notes

### What this story owns vs. defers

- This story owns the **cross-cutting TTS wrapper** (`src/lib/audio/tts.ts`) per AR20.
- This story does **not** build the Settings voice picker UI; that is Story 1.9 (but `useVoices()` must support the “Loading voices…” caption pattern).
- This story does **not** build HardWordRow / Daily Review UI. Those callers will use `speak(word)` later (epics.md references Story 1.7 from multiple later stories).

### Required behaviors and edge cases (prevent common TTS bugs)

- **Chrome voices async:** `speechSynthesis.getVoices()` can be empty on first call; the `voiceschanged` event is the reliable trigger (FR24).
- **Safari smaller voice set:** `getPersistedVoice()` must return `null` if the persisted voice is not available, and `speak()` must fall back (FR25).
- **SSR safety:** `app/layout.tsx` is a server component; `src/lib/audio/tts.ts` must not crash when imported in non-browser contexts. Keep `speechSynthesis` access inside functions/hooks and guard with `typeof window !== 'undefined'` (and/or `typeof speechSynthesis !== 'undefined'`). Do not reference `speechSynthesis` at module top-level.
- **No artificial delays:** do not add timeouts, spinners, or async waits before `speechSynthesis.speak()` (NFR4, UX spec: “TTS is essentially instant”).
 - **Persistence contract:** Voice selection persists as `audiblytics.settings.voiceURI` (architecture.md localStorage keys table). Do not invent a new key (prevents drift and keeps Settings + TTS aligned).

### Project Structure Notes

- File placement is fixed by AR20 + architecture.md tree:
  - `src/lib/audio/tts.ts` (this story)
  - Callers: `src/components/audiblytics/HardWordRow.tsx`, `src/features/review/*`, `src/features/settings/*` (future stories)

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` § Story 1.7 (lines 599–628)] — story statement + ACs
- [Source: `_bmad-output/planning-artifacts/epics.md` § Additional Requirements AR20 (line 181)] — audio wrapper contract
- [Source: `_bmad-output/planning-artifacts/prd.md` FR22–FR25] — TTS requirements (tap-to-pronounce, voice lifecycle, fallback)
- [Source: `_bmad-output/planning-artifacts/architecture.md` § Audio I/O wrappers (lines 495–511)] — intended API surface
- [Source: `_bmad-output/planning-artifacts/architecture.md` § Naming Patterns + localStorage keys (lines 612–626)] — storage key conventions
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` “One tap or zero” + loading states table (see sections mentioning “Tap a hard-word → TTS fires” and “TTS playback start icon flips, no loading”)] — UX expectations for instant playback

## Dev Agent Record

### Context Reference

- Sprint tracking indicates this story was in backlog and is now contexted as ready-for-dev.
- Previous story intelligence available: `1-6-hard-scope-boundary-three-layer-guard.md` (no direct dependency, but reinforces n=1 constraints and SSR awareness).
- At story-creation time, the workspace appears **not yet scaffolded** (no `package.json`, no `src/` folder detected). This story is still valid but requires Story 1.1 completion first.
- No `project-context.md` files were found in the workspace at story-creation time.

### Agent Model Used

Composer (Cursor agent)

### Debug Log References

(none)

### Completion Notes List

- **AC1:** `src/lib/audio/tts.ts` exports `useVoices`, `speak`, `getPersistedVoice`.
- **AC2:** `rg "speechSynthesis|SpeechSynthesisUtterance" src/` → matches only `src/lib/audio/tts.ts`.
- **AC3:** `useVoices` initializes `[]`, subscribes to `voiceschanged`, syncs with `[...speechSynthesis.getVoices()]` on mount and on event; cleanup removes listener; no `window` / `speechSynthesis` at module eval.
- **AC4:** `getPersistedVoice` returns `null` when URI missing or not in `getVoices()`; `speak` resolves voice via explicit → persisted match → default English / `default` / first voice; if no voices yet, utterance is spoken without `.voice` so the engine chooses.
- **AC5:** Initial `[]` from `useVoices` allows Story 1.9 “Loading voices…” until the event fills the list.
- **AC6:** `speak` is synchronous (cancel → `SpeechSynthesisUtterance` → `speak`) with no timeouts or awaits.

**Verification:** `pnpm exec tsc --noEmit` exit 0; `pnpm build` exit 0. `rg "window\\.localStorage|localStorage\\.(getItem|setItem)" src/` → only `src/lib/storage/use-local-storage.ts`.

**Task 5.2:** No in-app TTS control in repo at story time; runtime speech not manually exercised in browser.

### File List

- `src/lib/audio/tts.ts` (new)
- `src/lib/storage/use-local-storage.ts` (updated — `readPersistedSettingsVoiceUri`, shared `settingsSchema` read path)
- `_bmad-output/implementation-artifacts/1-7-browser-tts-wrapper-with-voice-lifecycle-handling.md` (Dev Agent Record + tasks)

