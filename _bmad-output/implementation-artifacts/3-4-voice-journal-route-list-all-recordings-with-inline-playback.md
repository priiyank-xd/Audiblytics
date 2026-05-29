# Story 3.4: Voice Journal Route — List All Recordings with Inline Playback

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Priyank,  
I want a route (accessible from `Today` or a sub-link) that lists every voice recording reverse-chronologically with metadata and inline playback,  
so that I can browse my recording history and replay any take without leaving the app shell.

## Acceptance Criteria

> Sourced from `_bmad-output/planning-artifacts/epics.md` § Story 3.4, plus architecture/UX constraints referenced below.

1. **AC1 — Voice Journal route renders recordings list** (FR35, UX-DR14)  
   Given the user navigates to the Voice Journal route (via an in-Today link; dedicated list view required for FR35)  
   When the route renders  
   Then the page shows `<VoiceJournalList>` with one row per recording: `▶ Day N · Theme · 0:48 [↓]`  
   And the list is sorted by `recordingDate DESC` via `useLiveQuery`

2. **AC2 — Inline playback respects stored MIME** (cross-browser)  
   Given the user taps the play icon on any row  
   When playback begins  
   Then the row background shifts to `--cream-dim` and the icon flips to pause  
   And the audio plays back using the stored `mimeType` (NOT an assumed type)

3. **AC3 — Download recording uses correct extension + naming**  
   Given the user taps the download icon  
   When the click fires  
   Then the audio blob is downloaded as a `.webm` or `.mp4` file (matching the stored MIME)  
   And the filename is `audiblytics-day-N-HHMM.<ext>`

4. **AC4 — Empty state is calm and non-CTA** (UX-DR34)  
   Given there are zero recordings  
   When the route renders  
   Then the page shows a single italic Garamond line `"No recordings yet."`  
   And there is no CTA, no illustration

## Tasks / Subtasks

- [ ] **Task 0 — Preconditions / alignment checks** (AC: all)
  - [ ] 0.1 Ensure app scaffold exists (`package.json`, `src/`). If not, implement Story 1.1 first.
  - [ ] 0.2 Confirm Story 3.1 exists (`src/lib/audio/recorder.ts`) and recording rows persist `mimeType` alongside blob.
  - [ ] 0.3 Confirm Story 3.3 exists (recordings are written to Dexie `recordings` table with the schema fields required below).

- [ ] **Task 1 — Read files being modified (UPDATE — non-negotiable)** (AC: all)
  - [ ] 1.1 Read the Today screen composition and decide where to place the “View all recordings” affordance (should not interrupt the daily flow).
  - [ ] 1.2 Read any existing `VoiceJournalList` (or the inline “just saved” recordings list) implementation to reuse, not duplicate.
  - [ ] 1.3 Read `src/lib/storage/db.ts` to confirm the `recordings` table indexes and the canonical query pattern.
  - [ ] 1.4 Read `src/lib/schemas/recording.schema.ts` to confirm persisted fields available for rendering (`recordingDate`, `dayOfUse`, `mimeType`, `durationMs`, `blob`, and any `theme` if stored).

- [ ] **Task 2 — Add a dedicated Voice Journal route** (AC: 1, 4)
  - [ ] 2.1 Create `src/app/voice-journal/page.tsx` (NEW, `"use client"`) to render:
    - page title + light editorial shell (reuse existing layout shell; no new layout)
    - empty state line (AC4) when `recordings.length === 0`
    - `<VoiceJournalList recordings={...} />` when non-empty
  - [ ] 2.2 Add a link from Today to `/voice-journal` (exact placement per UX; should be discoverable but not loud).

- [ ] **Task 3 — Implement recordings query hook** (AC: 1)
  - [ ] 3.1 Implement `src/features/voice-journal/use-recordings.ts` (NEW) returning recordings sorted by `recordingDate DESC` via `useLiveQuery`.
  - [ ] 3.2 Keep cross-feature boundaries intact: the hook may import `db` and schema types from `lib/`, but `lib/` must not import `features/`.
  - [ ] 3.3 Ensure the list-row metadata can render `Theme`:
    - if `theme` is stored directly on the recording, use it
    - otherwise, join via `paragraphId` to the paragraph cache / paragraph record that contains `theme` (do not invent new storage just to satisfy the row label; reuse existing persisted data)

- [ ] **Task 4 — Playback UX in list rows** (AC: 2)
  - [ ] 4.1 In `VoiceJournalList`, use a single `<audio>` element + controlled “currently playing recording id” state.
  - [ ] 4.2 Build the playback URL from the stored blob + stored MIME (do not assume `.webm`).
  - [ ] 4.3 Ensure play/pause icon flip and row highlight reflect actual playback state.

- [ ] **Task 5 — Download action** (AC: 3)
  - [ ] 5.1 Implement download by creating an object URL for the blob and clicking a temporary `<a download>` element.
  - [ ] 5.2 Determine extension from `mimeType` (`audio/webm*` → `.webm`, `audio/mp4*` → `.mp4`).
  - [ ] 5.3 Filename format: `audiblytics-day-N-HHMM.<ext>` where:
    - `N` comes from the recording’s stored `dayOfUse`
    - `HHMM` is derived from `recordingDate` (display-local is fine; do not store new date fields)

- [ ] **Task 6 — Minimal manual verification** (AC: all)
  - [ ] 6.1 With 2+ recordings present, verify ordering is newest-first and play/pause works.
  - [ ] 6.2 Verify download filename + extension correctness on both Chrome (`.webm`) and Safari (`.mp4`) recordings.
  - [ ] 6.3 Verify empty state renders exactly when there are 0 recordings.

## Dev Notes

### Non-negotiable guardrails (avoid common disasters)

- **Do not re-implement recording**: this story only reads persisted recordings; recording creation is owned by Stories 3.1/3.3.
- **Cross-browser MIME is load-bearing**: playback + download must respect stored `mimeType` (Safari vs Chrome divergence).  
  - [Source: `_bmad-output/planning-artifacts/epics.md` § Story 3.4; `_bmad-output/planning-artifacts/architecture.md` Voice Journal cross-browser handling]
- **Use Dexie live queries**: list ordering must come from `useLiveQuery` with `recordingDate DESC` (no manual resorting after query).  
  - [Source: `_bmad-output/planning-artifacts/epics.md` § Story 3.4]
- **Theme label must be real**: the row’s `Theme` comes from persisted data (recording row itself or the associated paragraph via `paragraphId`), not from UI state.  
  - [Source: `_bmad-output/planning-artifacts/epics.md` § Story 3.4; `_bmad-output/planning-artifacts/architecture.md` data flow + paragraph cache]
- **Follow layering/import direction**: `app/` → `features/` → `components/` → `lib/`.  
  - [Source: `_bmad-output/planning-artifacts/architecture.md` layered import direction]

### Expected file targets (align to architecture)

- Route:
  - `src/app/voice-journal/page.tsx` (NEW)
- Voice-journal capability:
  - `src/features/voice-journal/use-recordings.ts` (NEW)
- UI:
  - `src/components/audiblytics/VoiceJournalList.tsx` (NEW or UPDATE; prefer UPDATE/reuse if it already exists)
- Storage/types:
  - `src/lib/storage/db.ts` (`db.recordings`)
  - `src/lib/schemas/recording.schema.ts`

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` § Story 3.4] — canonical story statement + ACs
- [Source: `_bmad-output/planning-artifacts/architecture.md` §§ Data Architecture, Audio I/O wrappers, Voice Journal cross-cutting concerns] — Dexie recordings table + MIME handling expectations
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` §§ Component Strategy (`VoiceJournalList`), Flow 2/UX-DR14] — row format + inline playback visuals + editorial empty state tone

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

- `_bmad-output/implementation-artifacts/3-4-voice-journal-route-list-all-recordings-with-inline-playback.md`
