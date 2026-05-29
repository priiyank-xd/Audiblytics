# Story 6.1: Review Queue Selector — Oldest-Reviewed-First

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Priyank,
I want a Daily Review session that surfaces N words from my collection prioritizing the words I haven't reviewed in the longest time (and never-reviewed words first),
so that the review consistently revisits forgotten material rather than rotating through whatever was most recent.

## Acceptance Criteria

1. **Navigation + hook (FR48, FR49)** — Given the user clicks **"Review"** in `<TopNav>` (a destination separate from the today’s-paragraph flow), when the `/review` route renders, then `src/features/review/use-review-queue.ts` runs (via the page or a thin wrapper component) and returns **up to N** `CollectionWord` rows sorted so that `lastReviewedAt === null` entries come **first**, then remaining rows sorted **ascending** by `lastReviewedAt` (UTC ISO datetime strings — lexicographic sort matches chronological order per NFR13). **N defaults to 7** (PRD §Open Decisions Q3). Among rows with `lastReviewedAt === null`, apply a **deterministic** tie-break (recommended: `savedAt` ascending) so ordering is stable across renders. [Source: `_bmad-output/planning-artifacts/epics.md` Story 6.1; `prd.md` FR48–FR49, Q3 default 7; `_bmad-output/planning-artifacts/architecture.md` `lastReviewedAt` index]

2. **Partial collection** — Given the collection has **fewer than N** words, when the queue is computed, then **all** available words are returned (no padding with placeholders, no error state). [Source: epics Story 6.1]

3. **Empty collection (UX-DR34)** — Given the collection is **empty**, when the route renders, then the page shows a **single italic Garamond line**: `No words to review yet. Save some hard words from today's paragraph.` — no illustration, no CTA button, no secondary copy. [Source: epics Story 6.1; `ux-design-specification.md` UX-DR34]

4. **Scope boundary vs 6.2** — Given the queue has one or more words, when this story ships, then **flip-card UI, TTS, and Got it / Almost / Forgot** are **out of scope** (Story 6.2–6.3). The `/review` route may show a **minimal read-only list** of the selected words in queue order (word text only, semantic typography) **or** mount only the hook and a placeholder region— but **`use-review-queue.ts` must be the single selector implementation** consumed later by Story 6.2. Do **not** duplicate queue-sort logic in the flashcard layer. [Source: epics Stories 6.1–6.2; `architecture.md` `features/review/` tree]

## Tasks / Subtasks

- [ ] **Constant + types** (AC: 1)
  - [ ] Export `REVIEW_BATCH_SIZE = 7` from `src/features/review/use-review-queue.ts` (or `src/features/review/constants.ts` if the team prefers a tiny barrel) — document that it implements PRD Q3 default; changing it is a product decision.

- [ ] **Implement `use-review-queue.ts`** (AC: 1, 2, 4)
  - [ ] Read collection rows via existing Dexie access patterns (`useLiveQuery` from `dexie-react-hooks` against `db.collection` per `architecture.md`, mirroring `use-collection.ts` patterns from Epic 2).
  - [ ] Implement pure sort: partition `lastReviewedAt == null` first (tie-break `savedAt` ASC), then non-null `lastReviewedAt` ASC.
  - [ ] Slice to `Math.min(REVIEW_BATCH_SIZE, sorted.length)`.
  - [ ] Return `{ queue: CollectionWord[], isLoading, ... }` shape consistent with other feature hooks (avoid throwing on empty DB).

- [ ] **Route + TopNav** (AC: 1, 3)
  - [ ] Add `src/app/review/page.tsx` (`'use client'` if hooks used) that composes `useReviewQueue` and renders empty state **exactly** per AC3 when `queue.length === 0` **and** underlying collection count is zero — distinguish “empty collection” from “non-empty collection but queue edge cases” (only empty collection triggers the DR34 line).
  - [ ] Ensure `src/components/audiblytics/TopNav.tsx` includes a **Review** link pointing to `/review`, with `aria-current="page"` when active (UX-DR19).

- [ ] **Non-empty minimal UI** (AC: 4)
  - [ ] For `queue.length > 0`, render a minimal ordered list of **word strings only** (no IPA/meaning on this story unless needed for a11y labels) **or** a clearly labeled placeholder block — sufficient for QA until `<Flashcard>` lands in 6.2.

- [ ] **Manual verification**
  - [ ] Seed collection with words with mixed `lastReviewedAt` / null; confirm order matches FR49.
  - [ ] Seed **6** words → all six returned; seed **10** → exactly **7** returned.
  - [ ] Empty Dexie collection → exact italic empty copy.

## Dev Notes

### Epic / dependency context

- **Epic 6** builds Daily Review on top of **Epic 2** collection storage (`CollectionWord` includes `reviewCount`, `lastReviewedAt`, `difficultyRating` per `collection.schema.ts`).
- **Prerequisite:** Dexie `collection` table + `lastReviewedAt` index exist (Story 1.4). **Do not** re-schema for this story.

### Architecture compliance

- **File location:** `src/features/review/use-review-queue.ts` — **not** under `features/collection/` (architecture FR48–FR52 correction; `architecture.md` project tree). [Source: `_bmad-output/planning-artifacts/architecture.md` lines ~1054–1057]
- **Import direction:** `app/` → `features/` → `components/` → `lib/` only (AR18).
- **IndexedDB:** All reads use shared `db` singleton from `src/lib/storage/db.ts`; types from `z.infer<typeof collectionWordSchema>`.
- **Performance:** For ≤100 collection rows (NFR5 scope), in-memory sort after `toArray()` or `useLiveQuery` is acceptable; avoid O(n²) patterns.

### Technical requirements

- **Sort key:** `lastReviewedAt` nullable ISO strings — `null` **always** sorts before any non-null string when implementing “never-reviewed first.”
- **No SRS:** MVP does **not** implement spaced-repetition algorithms — ordering is strictly oldest-review-first per FR49 (epic Epic 6 intro).
- **Nav:** Review is a **top-level** route alongside Today / Collection (UX-DR19); not nested under Today.

### Project Structure Notes

| Area | Path |
|------|------|
| Queue hook | `src/features/review/use-review-queue.ts` |
| Review route | `src/app/review/page.tsx` |
| Nav | `src/components/audiblytics/TopNav.tsx` |
| Schema | `src/lib/schemas/collection.schema.ts` |
| DB | `src/lib/storage/db.ts` |

### Previous story intelligence (Epic 5 → Epic 6 handoff)

- Epic 5 stories establish Today shell and warm-up; **no code overlap** with review queue — reuse **patterns** from `use-collection.ts` / `useLiveQuery` (Story 2.2) for reactive reads and UTC sort discipline.

### References

- `_bmad-output/planning-artifacts/epics.md` — Epic 6, Story 6.1 (authoritative AC)
- `_bmad-output/planning-artifacts/prd.md` — FR48–FR49, Open Decisions Q3 (N=7)
- `_bmad-output/planning-artifacts/architecture.md` — Dexie indexes (`lastReviewedAt`), `features/review/` layout
- `_bmad-output/planning-artifacts/ux-design-specification.md` — UX-DR19 (TopNav), UX-DR34 (empty state)

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
