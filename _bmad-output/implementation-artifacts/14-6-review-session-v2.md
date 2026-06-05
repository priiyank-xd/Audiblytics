# Story 14.6: Review Session v2

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Priyank,
I want Review as a centered flashcard with Easy/Medium/Hard/Again feedback,
so that review matches the review mockup (UX-V2-UI6).

## Acceptance Criteria

> Sourced from `epics.md` § Story 14.6, **UX-V2-UI6**, and `_bmad-output/design/ui-mockups-v2/ChatGPT_Image_May_28__2026__12_33_43_PM-*.png`. Builds on **14.1** shell and **`use-review-queue.ts`** (FR48–FR49). **Critical:** Epic 6 stories **6.1–6.3 were never implemented** — there is **no** `app/review/page.tsx` today; this story delivers **functional Daily Review + v2 UI** in one pass.

1. **AC1 — Route + empty states** — Given `/review`, when collection is empty, then show **exactly** one italic serif line: `No words to review yet. Save some hard words from today's paragraph.` (UX-DR34 / Story 6.1). When queue is non-empty, render session UI below. When session completes (all words in batch reviewed), show **exactly**: `Done for today.` (UX-DR34). Loading uses skeleton consistent with **14.4**.

2. **AC2 — Session layout** — Given queue length ≥ 1, when page renders at `xl+`, then layout is **center flashcard column + right review rail** inside `FeatureRouteShell` (mockup). Below `xl`, right rail stacks below card. Header: **"Review"** + subtitle **"Practice words. Reinforce memory. Build confidence."** Suppress **global `StatRail`** on `/review` in `AppShell.tsx` (same pattern as `/today`) — review rail replaces calendar/stat widgets.

3. **AC3 — Flashcard (center)** — Given current word, when card renders, then:
   - Shows **"Word {index+1} of {queue.length}"** (use actual batch length, **`REVIEW_BATCH_SIZE` max 7** — not mockup’s 12)
   - Front: headword (`text-headline-2` / serif primary) + IPA line + **speak** control (`speak(word)`; pause via `cancelSpeech` on toggle per **6.3**)
   - **"Reveal meaning"** button toggles back content (do not require 3D flip animation; `prefers-reduced-motion` → instant reveal)
   - Revealed: meaning (parse via `parseWordMeaning`), example sentence, IPA if not shown on front
   - Feedback section visible **only after reveal** (or always visible but disabled until reveal — prefer mockup: prompt before reveal, buttons after)

4. **AC4 — Feedback mapping (FR50–FR51)** — Given user taps a feedback button, when write succeeds, then persist via **`use-review-feedback.ts`** and advance to next word:

   | UI label | Internal outcome | `difficultyRating` delta |
   |----------|------------------|---------------------------|
   | Easy | `got-it` | `max(0, rating - 1)` |
   | Medium | `almost` | unchanged |
   | Hard | `forgot` | `min(2, rating + 1)` |
   | Again | `forgot` | same as Hard (MVP — no separate SRS) |

   Also: `reviewCount += 1`, `lastReviewedAt = now` UTC ISO. Use pure `applyFeedbackToWord` in `lib/review/` (testable). **`cancelSpeech()`** before persist/advance (Story 6.3). Errors → `InlineErrorSurface` on card (no toast). Return `Result<void, StorageError>` from feedback hook.

5. **AC5 — Right rail** — Given session in progress, when rail visible, then:
   - **Circular progress ring**: `{reviewedCount} / {queue.length}` words reviewed (SVG or CSS; semantic tokens only)
   - **Up Next**: next **3** words after current index (word text only; optional difficulty dot from `difficultyRating` 0=green, 1=yellow, 2=red — honest mapping, no fake “Easy/Medium” labels unless derived from rating)
   - Short encouragement line when `reviewedCount > 0` (static copy OK, e.g. “Keep going! You're doing great.”)

6. **AC6 — Queue source** — **Do not** re-sort or resize batch in UI. Import **`useReviewQueue`** / `selectReviewQueueBatch` as **only** queue source (`REVIEW_BATCH_SIZE = 7`). Session index is local state over that array order.

7. **AC7 — Keyboard (carryover 6.2)** — **Space** toggles reveal when focus in card region. Keys **`1`–`4`** → Easy / Medium / Hard / Again when revealed. Focus-visible rings on controls.

8. **AC8 — Regression** — Home dashboard Review card (`HomeDashboard` → `/review`) must load working session. Collection **Practice now** link must not 404. Do not break `useReviewQueue` export used by home.

9. **AC9 — Tests** — `lib/review/apply-feedback.test.ts` (FR51 math + clamping), `lib/review/feedback-outcome.test.ts` (button → outcome map), `lib/review/review-session.test.ts` (`upNextWords`, progress percent). `pnpm --filter @audiblytics/web test` + `typecheck` green.

10. **AC10 — Scope boundary** — **Out of scope (14.9 / stretch):** Session overview stats card (“8 mastered today”), horizontal dot timeline, Previous/Next nav (feedback advances queue), Tip card, Focus area / weak-words AI card, top-right “Session progress” modal, bookmark icon, batch size ≠ `REVIEW_BATCH_SIZE`. **Dexie-only queue** in API mode (pre-existing defer — do not block v2 UI). No new collection API for review writes in this story.

## Tasks / Subtasks

- [x] **Task 1 — Review domain logic** (AC: 4, 6, 9)
  - [x] 1.1 Create `apps/web/src/lib/review/feedback-outcome.ts` — `ReviewFeedbackOutcome`, `mapFeedbackButtonToOutcome`, export button union `'easy' | 'medium' | 'hard' | 'again'`.
  - [x] 1.2 Create `apps/web/src/lib/review/apply-feedback.ts` — move/port `applyFeedbackToWord` + `applyReviewFeedback(wordId, outcome)` using `db.collection` + `safeWrite` + Zod parse (from Story 6.2 spec).
  - [x] 1.3 Create `apps/web/src/lib/review/review-session.ts` — `upNextWords(queue, currentIndex, limit)`, `reviewProgress(reviewedCount, total)`.
  - [x] 1.4 Tests for 1.1–1.3.

- [x] **Task 2 — Session hooks** (AC: 3, 4, 6, 7)
  - [x] 2.1 Create `use-review-feedback.ts` — wraps `applyReviewFeedback`, exposes `isSubmitting`, last error.
  - [x] 2.2 Create `use-review-session.ts` — `{ currentIndex, currentWord, isRevealed, setRevealed, reviewedCount, advance, resetRevealOnWordChange }`.
  - [x] 2.3 Wire `cancelSpeech` on feedback submit and word advance.

- [x] **Task 3 — UI components** (AC: 3, 4, 5)
  - [x] 3.1 `ReviewFlashcard.tsx` — card chrome, reveal, TTS, inline error.
  - [x] 3.2 `ReviewFeedbackRow.tsx` — four semantic-token buttons (green/yellow/red/red borders per mockup — use existing token classes, not arbitrary hex).
  - [x] 3.3 `ReviewProgressRing.tsx` — percent + center label `N / M`.
  - [x] 3.4 `ReviewUpNextList.tsx` — up to 3 following words.

- [x] **Task 4 — Page + shell** (AC: 1, 2, 7, 8)
  - [x] 4.1 Create `apps/web/src/app/review/page.tsx` — compose queue hook + session + layout grid.
  - [x] 4.2 `AppShell.tsx` — hide global StatRail when `pathname === '/review'`.
  - [x] 4.3 Keyboard listener on page or card container (Space, 1–4).

- [x] **Task 5 — Verification** (AC: 9, all)
  - [x] 5.1 `pnpm --filter @audiblytics/web test`
  - [x] 5.2 `pnpm --filter @audiblytics/web typecheck`
  - [x] 5.3 Manual: empty collection copy, 3-word session, reveal, four feedback types, Dexie field updates, done state, home → review, collection Practice now, TTS cancel on feedback.

### Review Findings (2026-05-31)

- [x] [Review][Patch] Session queue frozen during render via ref mutation [`page.tsx`] — `useEffect` + `useState` snapshot; `waitingForSession` skeleton until frozen.
- [x] [Review][Patch] `handleFeedback` depended on whole `session` object [`page.tsx`] — destructure stable `advance` / `currentWord` deps.
- [x] [Review][Patch] Progress ring lacked accessible label [`ReviewProgressRing.tsx`] — `role="img"` + `aria-label`.
- [x] [Review][Defer] `useReviewQueue` Dexie-only in API mode — pre-existing defer; empty/honest states OK.
- [x] [Review][Defer] Keyboard 1–4 are window-global when revealed — Space remains card-scoped; acceptable for n=1.
- [x] [Review][Dismiss] Hard and Again share `forgot` outcome — per AC4 MVP table.
- [x] [Review][Dismiss] Legacy `Flashcard.tsx` flip UI removed — replaced by reveal pattern per AC3.

## Dev Notes

### Authority stack (read in order)

1. `epics.md` § Story 14.6 + **UX-V2-UI6** (not UI8 — UI8 is Journey)
2. Review mockup: `_bmad-output/design/ui-mockups-v2/ChatGPT_Image_May_28__2026__12_33_43_PM-*.png`
3. `6-1-review-queue-selector-oldest-reviewed-first.md` + `6-2-flashcard-ui-with-three-button-feedback.md` — **functional spec** (never shipped)
4. `14-1-design-tokens-and-app-shell-v2.md` — StatRail suppression pattern from `/today`
5. `architecture.md` § Implementation Patterns — `Result<T,E>`, inline errors, semantic tokens

### Brownfield baseline (read before coding)

| Asset | State | 14.6 action |
|-------|--------|-------------|
| `features/review/use-review-queue.ts` | **Exists** — Dexie `useLiveQuery`, `REVIEW_BATCH_SIZE=7`, `selectReviewQueueBatch` | **Reuse** — do not duplicate sort |
| `app/review/page.tsx` | **Missing** (nav links 404) | **Create** |
| `use-review-feedback.ts` | **Missing** | **Create** per 6.2 |
| `Flashcard.tsx` / flashcard state | **Missing** | **Create** v2 components (names above) |
| `HomeDashboard` | Links to `/review` | Must work after 14.6 |
| `CollectionWordDetailPanel` | Links to `/review` | Must work after 14.6 |
| `lib/audio/tts.ts` | `speak`, `cancelSpeech`, `SLOW_SPEECH_RATE` | Reuse for card TTS |

### Mockup → implementation map

| Mockup element | Implementation |
|----------------|----------------|
| Review title + subtitle | `page.tsx` header |
| Today's review overview card | **Out of scope** (14.9) |
| Word card + Reveal meaning | `ReviewFlashcard` |
| Easy / Medium / Hard / Again | `ReviewFeedbackRow` → `applyReviewFeedback` |
| Dot timeline + Prev/Next | **Out of scope** (14.9) |
| Progress ring + Up Next | `ReviewProgressRing` + `ReviewUpNextList` |
| Tip + Focus area cards | **Out of scope** (14.9) |
| Session progress top button | **Out of scope** (14.9) |

### Layout wireframe (`xl+`)

```
┌──────────┬─────────────────────────────┬──────────────────┐
│ Sidebar  │ Review (header)             │ (StatRail OFF)   │
│ (14.1)   │ ┌─────────────┬───────────┤                  │
│          │ │ Flashcard   │ Progress  │                  │
│          │ │ + feedback  │ Up Next   │                  │
│          │ └─────────────┴───────────┤                  │
└──────────┴─────────────────────────────┴──────────────────┘
```

### Feedback persistence (FR51) — canonical

```ts
// applyFeedbackToWord(row, outcome, nowIso):
reviewCount: row.reviewCount + 1
lastReviewedAt: nowIso
difficultyRating:
  got-it  → max(0, row.difficultyRating - 1)
  almost  → row.difficultyRating
  forgot  → min(2, row.difficultyRating + 1)
```

Validate written row with `collectionWordSchema.parse`.

### API mode deferral

`useReviewQueue` reads Dexie only (`deferred-work.md` — review queue API mode). In API mode, queue may be empty while server collection has words — **do not fix in 14.6** unless trivial hook swap to `useCollection` + `selectReviewQueueBatch`; document honest empty state.

### Previous story learnings (14.5 / 14.4)

- Suppress global StatRail when page has its own right rail (`/today`, now `/review`).
- Reuse `parseWordMeaning`, `formatIpaDisplay` from collection/today libs.
- Pure helpers + `node:test`; no throws for storage failures.
- Mockup counts (12 words) ≠ product `REVIEW_BATCH_SIZE` (7) — **product constant wins**.

### Architecture compliance

- **Paths:** `features/review/*` hooks; `components/audiblytics/Review*.tsx`; `lib/review/*` pure logic; `app/review/page.tsx`.
- **No toasts** for feedback failures.
- **Dates:** UTC ISO on write only.
- **Reference decision IDs** in PR: FR48–FR51, UX-V2-UI6, Epic 14.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Story 14.6, UX-V2-UI6]
- [Source: `_bmad-output/design/ui-mockups-v2/index.md`]
- [Source: `_bmad-output/implementation-artifacts/6-1-review-queue-selector-oldest-reviewed-first.md`]
- [Source: `_bmad-output/implementation-artifacts/6-2-flashcard-ui-with-three-button-feedback.md`]
- [Source: `apps/web/src/features/review/use-review-queue.ts`]
- [Source: `apps/web/src/lib/schemas/collection.schema.ts`]

## Dev Agent Record

### Agent Model Used

Composer

### Debug Log References

### Completion Notes List

- Shipped `/review` v2: reveal flashcard, Easy/Medium/Hard/Again → FR51, progress ring + Up Next rail.
- Migrated Epic 6 logic to `lib/review/*`; removed legacy `Flashcard.tsx` flip UI.
- `AppShell` hides global StatRail on `/review` (session rail replaces it).
- 118 tests pass; typecheck green.
- CR patches: session freeze via effect, stable feedback deps, progress ring a11y.

### File List

- `apps/web/src/app/review/page.tsx`
- `apps/web/src/components/audiblytics/AppShell.tsx`
- `apps/web/src/components/audiblytics/ReviewFlashcard.tsx`
- `apps/web/src/components/audiblytics/ReviewFeedbackRow.tsx`
- `apps/web/src/components/audiblytics/ReviewProgressRing.tsx`
- `apps/web/src/components/audiblytics/ReviewUpNextList.tsx`
- `apps/web/src/components/audiblytics/Flashcard.tsx` (deleted)
- `apps/web/src/features/review/use-review-feedback.ts`
- `apps/web/src/features/review/use-review-session.ts`
- `apps/web/src/features/review/use-review-word-tts.ts`
- `apps/web/src/features/review/use-flashcard-state.ts` (deleted)
- `apps/web/src/lib/review/apply-feedback.ts`
- `apps/web/src/lib/review/apply-feedback.test.ts`
- `apps/web/src/lib/review/feedback-outcome.ts`
- `apps/web/src/lib/review/feedback-outcome.test.ts`
- `apps/web/src/lib/review/review-session.ts`
- `apps/web/src/lib/review/review-session.test.ts`
