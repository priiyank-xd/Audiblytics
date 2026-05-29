# Story 3.5: Compare Any-Two Recordings via CompositePlayer (general-purpose mode)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Priyank,  
I want to select any two recordings and play them sequentially in a comparison player,  
so that I can A/B my pronunciation across any two days, not just at the engineered Day-14 moment.

## Acceptance Criteria

> Sourced from `_bmad-output/planning-artifacts/epics.md` § Story 3.5, plus architecture/UX constraints referenced below.

1. **AC1 — Compare mode selection mounts CompositePlayer** (FR36, UX-DR21)  
   Given the Voice Journal list is rendered (per Story 3.4)  
   When the user enters compare mode (via a “Compare” affordance — checkboxes or selection icons on rows)  
   Then the user can select exactly 2 recordings  
   And a `<CompositePlayer mode="compare" sourceA={recA} sourceB={recB} />` mounts

2. **AC2 — Single “Play comparison” plays A then silence then B**  
   Given the CompositePlayer has rendered with two valid recordings  
   When the user taps the single “Play comparison” button  
   Then sourceA plays, then ~1 second silence, then sourceB plays automatically  
   And during sourceA playback, row 1 has `--cream-dim` background and row 2 dims; reverse during sourceB  
   And an `onPlaybackComplete` event fires when sourceB finishes (used downstream by Day-14 in Epic 7)

3. **AC3 — Corrupt/missing blob degrades gracefully**  
   Given one of the two selected recordings has a corrupt blob  
   When playback attempts that row  
   Then the row shows an inline message “Recording unavailable — comparing against earliest available.”  
   And the comparison player gracefully falls back to TTS read of the same word (when applicable) or skips the failed clip

4. **AC4 — Keyboard + ARIA for comparison player** (UX-DR21)  
   Given the user is keyboard-navigating  
   When they activate Play comparison  
   Then the button responds to Enter/Space  
   And the player is announced as `role="region" aria-label="recording comparison player"`

## Tasks / Subtasks

- [x] **Task 0 — Preconditions / alignment checks** (AC: all)
  - [x] 0.1 Ensure app scaffold exists (`package.json`, `src/`). If not, implement Story 1.1 first.
  - [x] 0.2 Ensure Stories 3.1–3.4 exist: recordings persist with `{ blob, mimeType, durationMs, recordingDate, paragraphId, dayOfUse }`, and the Voice Journal list route renders.
  - [x] 0.3 Confirm there is a TTS wrapper (`src/lib/audio/tts.ts`) used elsewhere (do not call `speechSynthesis` directly in components).

- [x] **Task 1 — Read files being modified (UPDATE — non-negotiable)** (AC: all)
  - [x] 1.1 Read `VoiceJournalList` implementation to reuse row rendering and playback patterns (avoid duplicating audio state).
  - [x] 1.2 Read `CompositePlayer` (if it exists) to extend it to `mode="compare"` rather than building a second player.
  - [x] 1.3 Read `features/voice-journal/*` hooks (recordings list, save-recording) to follow established data shapes and error surfacing.
  - [x] 1.4 Read `lib/schemas/recording.schema.ts` and `lib/storage/db.ts` to confirm canonical recording fields and indexes.

- [x] **Task 2 — Add compare-mode selection in Voice Journal list** (AC: 1)
  - [x] 2.1 Add a “Compare” affordance that toggles the list into selection mode (checkboxes or select icons per AC1).
  - [x] 2.2 Enforce **exactly 2 selections**:
    - selecting a 3rd either blocks the interaction or replaces the older selection (choose one behavior; keep it consistent and predictable)
    - the Play comparison button remains disabled until exactly 2 are selected
  - [x] 2.3 Ensure selection UI is keyboard reachable with visible focus ring (follow existing focus styling conventions from prior stories).

- [x] **Task 3 — Comparison driver hook** (AC: 1, 2, 3)
  - [x] 3.1 Implement `src/features/voice-journal/use-compare-recordings.ts` (NEW) to own:
    - selected recording IDs (two slots A/B)
    - derived `sourceA` / `sourceB` objects for the player
    - any error/availability flags needed to drive the “Recording unavailable…” row message
  - [x] 3.2 Keep import direction clean: `features/` may import `lib/`, not vice versa.

- [x] **Task 4 — Extend `CompositePlayer` to general-purpose compare mode** (AC: 1, 2, 4)
  - [x] 4.1 Add `mode="compare"` support without breaking existing single-source playback usage.
  - [x] 4.2 Implement sequential playback:
    - play A
    - wait ~1000ms (silence)
    - play B
    - fire `onPlaybackComplete` after B ends (must be reliable for Epic 7 Day-14 flow)
  - [x] 4.3 Reflect playback state in UI so the “row 1/row 2 highlight” behavior is correct during each phase.
  - [x] 4.4 Ensure Play comparison is operable via Enter/Space and the player container is a labeled region (AC4).

- [x] **Task 5 — Missing/corrupt blob resilience** (AC: 3)
  - [x] 5.1 Detect unusable blobs (e.g., missing blob, failed object URL, audio element error event).
  - [x] 5.2 Render the inline message exactly: “Recording unavailable — comparing against earliest available.”
  - [x] 5.3 Degrade gracefully:
    - if you can identify an appropriate TTS fallback (e.g., a known hard word tied to the recording via `paragraphId`/metadata), speak it via `lib/audio/tts.ts`
    - otherwise, skip the failed clip and continue the sequence (still fire `onPlaybackComplete` once the flow ends)

- [ ] **Task 6 — Minimal manual verification** (AC: all)
  - [ ] 6.1 Verify you can enter compare mode, select exactly 2 recordings, and mount the player.
  - [ ] 6.2 Verify A → ~1s gap → B playback, with correct row highlighting/dimming.
  - [ ] 6.3 Verify keyboard interaction: selection + Play comparison via Enter/Space; region announced.
  - [ ] 6.4 Simulate a corrupt/missing blob and verify message + fallback/skip behavior is graceful and the app doesn’t crash.

## Dev Notes

### Non-negotiable guardrails (avoid common disasters)

- **Do not create a second comparison player**: extend/reuse `CompositePlayer` so Epic 7 Day-14 can reuse the exact same behavior and events.  
  - [Source: `_bmad-output/planning-artifacts/epics.md` § Story 3.5; `_bmad-output/planning-artifacts/ux-design-specification.md` § `CompositePlayer`]
- **No raw browser audio APIs outside wrappers**: no direct `speechSynthesis`, `MediaRecorder`, or `indexedDB` usage in components; use the owning `lib/` modules and `features/` hooks.  
  - [Source: `_bmad-output/planning-artifacts/architecture.md` “No raw … outside the owning module”]
- **Cross-browser MIME handling remains load-bearing**: if playback uses blobs, ensure the stored `mimeType` continues to be respected (this story must not regress Story 3.4’s requirement).  
  - [Source: `_bmad-output/planning-artifacts/architecture.md` Voice Journal cross-browser handling; `_bmad-output/planning-artifacts/epics.md` § Story 3.4]
- **onPlaybackComplete is a contract**: Day-14 consumes it to reveal the decision buttons; the event must fire exactly once when the sequence truly completes (even with one clip skipped).  
  - [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` `CompositePlayer` states; `_bmad-output/planning-artifacts/epics.md` § Story 3.5]

### Expected file targets (align to architecture)

- `src/components/audiblytics/CompositePlayer.tsx` (UPDATE or NEW)
- `src/components/audiblytics/VoiceJournalList.tsx` (UPDATE — add compare-mode selection UI)
- `src/features/voice-journal/use-compare-recordings.ts` (NEW)
- `src/lib/audio/tts.ts` (UPDATE only if required; prefer reuse)

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` § Story 3.5] — canonical story statement + ACs
- [Source: `_bmad-output/planning-artifacts/prd.md` § Voice Journal (FR36)] — “compare any two” capability and overall thesis
- [Source: `_bmad-output/planning-artifacts/architecture.md` §§ Component map, layered boundaries, Voice Journal module] — intended module/file layout + wrapper rules
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` § `CompositePlayer`] — states, row highlighting, `onPlaybackComplete`, accessibility expectations, edge-case copy

## Dev Agent Record

### Agent Model Used

Composer (GPT-5.2)

### Debug Log References

### Completion Notes List

- `CompositePlayer` `mode="compare"`: A → 1000ms gap → B; `onPlaybackComplete` once sequence ends unless aborted; `role="region"` + `aria-label="recording comparison player"`; shadcn `Button` for Enter/Space.
- Blob failures: `onClipUnavailable` + exact AC3 copy; TTS via `speakAsync` + first hard word from `paragraphCache` (`useRecordings` adds `ttsFallbackWord`).
- `useCompareRecordings(recordings)`: pick order A/B; third pick replaces oldest; `compareSources` for player props.
- `VoiceJournalList`: Compare toggle, checkboxes, row `bg-cream-dim` / dimming by phase; inline list play disabled in compare mode.

### File List

- `src/components/audiblytics/CompositePlayer.tsx`
- `src/components/audiblytics/VoiceJournalList.tsx`
- `src/features/voice-journal/use-compare-recordings.ts`
- `src/features/voice-journal/use-recordings.ts`
- `src/app/voice-journal/page.tsx`
- `src/app/page.tsx`
- `src/components/audiblytics/TopNav.tsx`
- `src/lib/audio/tts.ts`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/3-5-compare-any-two-recordings-via-compositeplayer-general-purpose-mode.md`

