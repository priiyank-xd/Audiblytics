# Story 2.2: Collection Route — List, Sort by Recency, Per-Word TTS, Remove

Status: ready-for-dev

## Story

As Priyank,
I want a `/collection` route that lists every saved word sorted by save recency with inline TTS playback and a remove action,
so that I can browse my vocabulary, hear words, and prune entries without going through the Today screen.

## Acceptance Criteria

1. **Given** the user clicks "Collection" in TopNav  
   **When** the route renders  
   **Then** the page shows a list of collection entries sorted by `savedAt DESC` (per FR27)  
   **And** each row renders word + IPA (mono) + meaning + example with a play-TTS icon and a remove icon  
   **And** the list updates reactively via `useLiveQuery` from `dexie-react-hooks`  
   **And** initial render with ≤100 words completes in <200ms  
   [Source: `_bmad-output/planning-artifacts/epics.md` “Story 2.2”; `_bmad-output/planning-artifacts/architecture.md` “dexie-react-hooks useLiveQuery”; `prd.md` FR27, NFR5]

2. **Given** the collection is empty (first-time user)  
   **When** the route renders  
   **Then** the page shows a single italic Garamond line "No words saved yet." — no CTA, no illustration, no "Get started!" copy  
   [Source: `_bmad-output/planning-artifacts/epics.md` “Story 2.2”; `_bmad-output/planning-artifacts/ux-design-specification.md` (anti-empty-state-illustration tone + editorial typography)]

3. **Given** the user taps a word's TTS play icon  
   **When** playback fires  
   **Then** `speak(word)` runs via the TTS wrapper  
   [Source: `_bmad-output/planning-artifacts/epics.md` “Story 2.2”; `prd.md` FR22; `_bmad-output/planning-artifacts/architecture.md` “Audio I/O wrappers”]

4. **Given** the user taps the remove icon  
   **When** the click fires  
   **Then** the word is deleted from the Dexie `collection` table  
   **And** the row disappears from the list immediately (via `useLiveQuery` re-render)  
   **And** no "Are you sure?" confirmation appears  
   [Source: `_bmad-output/planning-artifacts/epics.md` “Story 2.2”; `prd.md` FR28; `_bmad-output/planning-artifacts/ux-design-specification.md` “One tap or zero” / confirmation-ban]

5. **Given** the user is keyboard-navigating  
   **When** they tab through the list  
   **Then** each row's TTS and remove icons are focusable with forest focus ring visible  
   [Source: `_bmad-output/planning-artifacts/epics.md` “Story 2.2”; `_bmad-output/planning-artifacts/ux-design-specification.md` focus-ring rules]

## Tasks / Subtasks

- [ ] Add `/collection` route page (AC: 1, 2)
  - [ ] Create `src/app/collection/page.tsx` as a client component and wire it into the app shell navigation (TopNav "Collection")
  - [ ] Render empty state as a single italic Garamond line: `No words saved yet.`

- [ ] Implement collection query hook + reactive list (AC: 1)
  - [ ] Add `src/features/collection/use-collection.ts` returning a `useLiveQuery` result sorted by `savedAt DESC`
  - [ ] Ensure the sort key is the persisted UTC ISO datetime string and not local time

- [ ] Implement `CollectionList` UI rows (AC: 1, 3, 4, 5)
  - [ ] Create/extend a list row component (recommended: `src/components/audiblytics/CollectionRow.tsx`)
  - [ ] Each row renders:
    - [ ] **Word** (serif), **IPA** (mono), **meaning** (serif), **exampleSentence** (serif)
    - [ ] TTS play button with `aria-label="Pronounce <word>"`
    - [ ] Remove button with `aria-label="Remove <word> from collection"`
  - [ ] Use semantic tokens only (no arbitrary hex/px values)
  - [ ] Ensure focus ring uses forest token and is visible on both icon buttons

- [ ] Wire per-word TTS playback (AC: 3)
  - [ ] Use the existing TTS wrapper (`src/lib/audio/tts.ts`) rather than calling `speechSynthesis` directly in UI components

- [ ] Wire remove action (AC: 4)
  - [ ] Add `src/features/collection/use-remove-word.ts` that deletes by primary key (`id`) and returns a Result-shaped outcome
  - [ ] No confirmation modal; deletion is single-tap and immediately reflected via `useLiveQuery`
  - [ ] On Dexie delete failure, surface inline storage error near the row (reuse `<InlineErrorSurface variant="storage">`)

## Dev Notes

- **Dependencies / ordering**
  - This story assumes the project scaffold and navigation shell exist (Epic 1 Story 1.1 + TopNav + app shell). If the codebase is not yet scaffolded, implement those stories first; do not invent a different structure than `architecture.md`’s “Complete Project Tree”.

- **Must-follow architecture patterns**
  - **Dexie + reactive reads**: use `dexie-react-hooks` `useLiveQuery` for the collection list; do not manually sync list state after deletes.  
    [Source: `_bmad-output/planning-artifacts/architecture.md` “Reactive bindings”]
  - **Zod schemas are source of truth** for collection record shape; TypeScript types must be derived via `z.infer<>`.  
    [Source: `_bmad-output/planning-artifacts/architecture.md` “Persisted record shapes”]
  - **UTC timestamps**: `savedAt` is stored as UTC ISO datetime string; sorting must work lexicographically on that field.  
    [Source: `_bmad-output/planning-artifacts/architecture.md` “Date/time format (NFR13)”]
  - **No confirm modals / no toasts** for remove or playback; state change is the feedback.  
    [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` “One tap or zero” / anti-patterns; `prd.md` NFR23]

- **Expected touchpoints (create if missing; update if present)**
  - `src/app/collection/page.tsx`
  - `src/features/collection/use-collection.ts`
  - `src/features/collection/use-remove-word.ts`
  - `src/lib/storage/db.ts` (ensure `collection` table + `savedAt` index exists per architecture)
  - `src/lib/schemas/collection.schema.ts`
  - `src/lib/audio/tts.ts`
  - `src/components/audiblytics/TopNav.tsx` (or equivalent) to include Collection link
  [Source: `_bmad-output/planning-artifacts/architecture.md` “Project Tree” + “Folder decision tree”]

- **Manual validation (no test framework in MVP)**
  - Add a few saved words (Story 2.1), open `/collection`, verify newest appears first
  - Tap TTS on a row, verify speech plays (Chrome + Safari best-effort)
  - Remove a word; row disappears immediately; refresh and confirm it stays removed

### References

- `_bmad-output/planning-artifacts/epics.md` — Epic 2, Story 2.2
- `_bmad-output/planning-artifacts/prd.md` — FR27, FR28, FR22, NFR5, NFR23
- `_bmad-output/planning-artifacts/architecture.md` — Dexie + useLiveQuery, folder structure, token rules, UTC timestamps, TTS wrapper
- `_bmad-output/planning-artifacts/ux-design-specification.md` — editorial typography, one-tap rule, no confirmation modals, focus ring expectations

## Dev Agent Record

### Agent Model Used

GPT-5.2

### Debug Log References

### Completion Notes List

### File List

