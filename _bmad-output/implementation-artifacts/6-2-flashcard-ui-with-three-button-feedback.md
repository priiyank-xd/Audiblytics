# Story 6.2: Flashcard UI with Three-Button Feedback

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Priyank,
I want each review item rendered as a flip-card showing the word, with the back revealing meaning + example + IPA, plus three feedback buttons (Got it / Almost / Forgot),
so that I can self-assess each word in <5 seconds and the system can update review metadata.

## Acceptance Criteria

1. **Card front (FR50, UX-DR27)** — Given the review queue from `use-review-queue` has at least one word, when `/review` shows the first card, then `<Flashcard>` displays the **word only**, centered, **EB Garamond at `text-3xl`**, with an explicit **“Tap to flip”** affordance. The front must **not** show IPA, meaning, or example. [Source: `epics.md` Story 6.2; `epics.md` UX-DR27]

2. **Flip interaction** — Given the user **taps the card** or presses **Space**, when the flip completes, then the **back** shows **IPA** in **JetBrains Mono** with `<span lang="en-fonipa">` on IPA text (match `HardWordRow` / UX-DR12 pattern), plus **meaning**, plus **example sentence**, plus a **per-word TTS play control** (Lucide **`Play`**, ≥44×44px target per UX-DR4/UX-DR8) so FR52 is satisfied on the card back. Below the card content, render three labeled buttons: **Got it**, **Almost**, **Forgot** (FR50). Call **`speak(word)`** from `src/lib/audio/tts.ts` on play press for basic pronunciation; **Story 6.3** adds play/pause swap, latency ceiling, and cancel-on-feedback behavior. [Source: `epics.md` Story 6.2–6.3; `epics.md` UX-DR27]

3. **Feedback persistence (FR51)** — Given the user clicks **Got it**, **Almost**, or **Forgot**, when the handler runs, then for that `CollectionWord` row: `reviewCount` increments by **1**; `lastReviewedAt` is set to **now** as **UTC ISO datetime** (`YYYY-MM-DDTHH:mm:ss.sssZ`, NFR13); `difficultyRating` updates as: **Got it** → `max(0, difficultyRating - 1)`; **Almost** → unchanged; **Forgot** → `min(2, difficultyRating + 1)`. Persist via **`src/features/review/use-review-feedback.ts`** (Dexie `collection` update using shared `db` + Zod-validated shape). [Source: `epics.md` Story 6.2; `architecture.md`; `collection.schema.ts`]

4. **Queue progression** — After a successful feedback write, show the **next** word in queue order (same order as `use-review-queue` output). When no words remain, show **exactly** one italic Garamond line: `Done for today.` (UX-DR34 — no CTA, no illustration). [Source: `epics.md` Story 6.2; `epics.md` UX-DR34]

5. **Keyboard (UX-DR37)** — **Space** toggles flip when focus is on the card region. Keys **`1` / `2` / `3`** map to **Got it / Almost / Forgot** respectively when review is active (single-key shortcuts). Maintain **focus-visible** ring pattern (`focus-visible:ring-2 focus-visible:ring-forest`) on interactive elements. [Source: `epics.md` Story 6.2; `epics.md` UX-DR37]

6. **Scope vs 6.1** — Do **not** reimplement queue ordering or `N`; import **`useReviewQueue`** (or equivalent export from `src/features/review/use-review-queue.ts`) as the **only** queue source. [Source: `6-1-review-queue-selector-oldest-reviewed-first.md` AC4]

## Tasks / Subtasks

- [ ] **`use-flashcard-state.ts`** (AC: 1, 2, 5)
  - [ ] State machine: `front` ↔ `back`, flip from tap / Space; reset to `front` when `currentWord.id` changes.
  - [ ] Expose stable handlers for keyboard layer (`onFlip`, feedback intents).

- [ ] **`use-review-feedback.ts`** (AC: 3)
  - [ ] Export async (or Result-shaped) `applyReviewFeedback(wordId, outcome: 'got-it' | 'almost' | 'forgot')` that reads current row, applies FR51 math, writes with Dexie, returns success/failure **without** throwing on expected DB errors (match `Result<T,E>` patterns in `architecture.md`).

- [ ] **`Flashcard.tsx`** (AC: 1, 2, 5)
  - [ ] Named export, props typed and exported; `'use client'` if using hooks/events.
  - [ ] Front / back layout per UX-DR27; semantic tokens only (UX-DR5); `cn()` for classes.
  - [ ] Back: IPA + meaning + example + **Play** control calling **`speak(word)`** (`lib/audio/tts.ts`); three **`Button`** variants per hierarchy (one primary commit per screen — UX-DR29: typically **Got it** as forest primary; **Almost** / **Forgot** as secondary/outline per existing button patterns).
  - [ ] Respect **`prefers-reduced-motion`**: flip animation **instant** when reduce is set (UX-DR39). If using a CSS transition for flip, document alignment with **UX-DR36** (only five tracked transitions product-wide — prefer **instant** flip or justify alongside existing patterns).

- [ ] **`src/app/review/page.tsx`** (AC: 4, 6)
  - [ ] Compose `useReviewQueue` + local index state; pass current `CollectionWord` into `<Flashcard>`; on feedback success, increment index or show done line.
  - [ ] Preserve Story **6.1** empty state when collection empty / queue empty per AC.

- [ ] **Tests / verification** (manual acceptable for MVP per architecture)
  - [ ] Three outcomes update Dexie fields correctly; clamping at 0 and 2 for `difficultyRating`.
  - [ ] Queue exhaust shows exact **Done for today.** copy.
  - [ ] Keyboard: Space flip; 1/2/3 triggers three buttons.

## Dev Notes

### Epic / dependency context

- **Epic 6** Daily Review: **6.1** provides ordered queue and `/review` shell — **extend**, do not fork sort logic.
- **Epic 2** `CollectionWord` fields (`reviewCount`, `lastReviewedAt`, `difficultyRating`) are already on `collectionWordSchema` (`architecture.md` excerpt).

### Architecture compliance

| Artifact | Requirement |
|----------|-------------|
| **Paths** | `src/components/audiblytics/Flashcard.tsx`, `src/features/review/use-flashcard-state.ts`, `src/features/review/use-review-feedback.ts`, `src/features/review/use-review-queue.ts`, `src/app/review/page.tsx` [Source: `architecture.md` project tree ~1031–1057] |
| **Imports** | `app/` → `features/` → `components/` → `lib/` only (AR18). |
| **DB** | `db.collection` updates via shared `src/lib/storage/db.ts`; types from `z.infer<typeof collectionWordSchema>`. |
| **No event bus** | Props/callbacks + Dexie for cross-component sync (`architecture.md` Communication Patterns). |

### Technical requirements

- **ISO timestamps:** Use a single UTC helper consistent with other features (e.g. `new Date().toISOString()` for `lastReviewedAt`).
- **No SRS algorithm:** Ordering stays oldest-reviewed-first from the queue only (Epic 6 intro).
- **Icons:** Lucide only, `currentColor`, sizes per UX-DR4.

### Project Structure Notes

| Area | Path |
|------|------|
| Flashcard UI | `src/components/audiblytics/Flashcard.tsx` |
| Flip state | `src/features/review/use-flashcard-state.ts` |
| Dexie feedback | `src/features/review/use-review-feedback.ts` |
| Queue (read-only) | `src/features/review/use-review-queue.ts` |
| Route | `src/app/review/page.tsx` |
| Schema | `src/lib/schemas/collection.schema.ts` |
| TTS | `src/lib/audio/tts.ts` |

### Previous story intelligence (6.1)

- **`use-review-queue.ts`** is the **single** selector: `REVIEW_BATCH_SIZE = 7`, null `lastReviewedAt` first, tie-break `savedAt` ASC, slice to N.
- **Empty copy** for zero collection: `No words to review yet. Save some hard words from today's paragraph.` — keep unchanged when `queue.length === 0` from empty collection.
- Replace **placeholder list-only UI** with `<Flashcard>` when implementing this story.

### Project context reference

- No `project-context.md` found in repo root at story creation time; follow `architecture.md` + PRD + UX fragments in `epics.md`.

### Git intelligence

- Repository has **no git history** in this workspace snapshot — rely on architecture and prior story files for conventions.

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
