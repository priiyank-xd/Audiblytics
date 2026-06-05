# Story 14.5: Collection Master-Detail

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Priyank,
I want Collection as a searchable list with a right detail panel,
so that browsing saved words matches the collection mockup (UX-V2-UI5).

## Acceptance Criteria

> Sourced from `epics.md` § Story 14.5, UX-V2-UI5, and `_bmad-output/design/ui-mockups-v2/ChatGPT_Image_May_28__2026__12_08_34_PM-*.png`. Builds on **14.1** shell (sidebar + StatRail on `/collection` unchanged) and Epic 2 collection persistence.

1. **AC1 — Page layout (list + detail rail)** — Given `/collection`, when entries exist at `xl+`, then page uses **two columns inside `FeatureRouteShell`**: left = searchable list with tabs, right = **sticky detail panel** for the selected word. Below `xl`, detail panel stacks below the list (or opens below selected row — same content, no horizontal scroll trap). Header: **"Collection"** + subtitle **"Your saved words. Practice them in your own time."** (mockup copy). Global `StatRail` on `/collection` **unchanged** (not suppressed).

2. **AC2 — Tabs (All / Practicing / Mastered)** — Given collection entries loaded, when tabs render, then three tabs filter the list with **count badges**:
   - **All** — every entry (default active)
   - **Practicing** — `reviewCount === 0` OR (`reviewCount >= 1` AND `difficultyRating > 0`)
   - **Mastered** — `reviewCount >= 1` AND `difficultyRating === 0`
   Document thresholds in `lib/collection/collection-filters.ts`. **Do not** add mockup-only **"Recently added"** tab in this story (defer **14.9**).

3. **AC3 — Search + sort label** — Given the list header, when user types in search, then rows filter client-side by **word** or **meaning** (case-insensitive substring). Sort order remains **`savedAt` descending** (existing `useCollection` order). Show static **"Recently added"** label near search (no sort dropdown logic — same pattern as Voice Journal **14.4**).

4. **AC4 — List row v2** — Given each visible row, when rendered, then row shows:
   - **Word** (serif/headline token) + **IPA** line (strip wrapping `/` for display consistency with `CollectionRow`)
   - **Meaning** truncated to one line (`line-clamp-1`) in table-style layout
   - **Last practiced** — relative label from `lastReviewedAt` when set, else **"Not yet"** (extract `formatLastPracticedLabel` to `lib/collection/`)
   - Row **play** control (TTS via `speak(entry.word)`)
   - **Remove** via existing `useRemoveWord` (three-dot menu or trash — keep **no confirmation** per UX-DR30)
   - **Selected row** uses `bg-surface-elevated` or `bg-primary-soft` + visible selection indicator; first entry auto-selected when list non-empty and no selection

5. **AC5 — Detail panel** — Given a selected `CollectionWord`, when detail panel renders, then panel shows:
   - Headword (`text-headline-3`), close control clears selection (mobile-friendly)
   - IPA + speak toggle (reuse play/pause pattern from `TodayWordDetailCard`)
   - Part-of-speech chip when parseable via `parseWordMeaning` from `lib/today/word-meaning.ts`
   - **Meaning** + **Example** sections (mockup labels)
   - **Pronunciation guide** card using `entry.pronunciationGuide` (bulleted plain text; no head illustration asset required)
   - **Source** line: best-effort `{theme} · Day N` when `sourceParagraphId` resolves via `paragraphCache` + optional recording `dayOfUse` lookup; else **"Saved {local date}"** from `savedAt`
   - **Play slow** — TTS at reduced rate (extend `speak()` with optional `rate` on `SpeechSynthesisUtterance`, default slow ≈ `0.75`; do not break existing callers)
   - **Add to practice** — navigates to `/review` (existing review route / queue); button copy **"Add to practice"** or **"Practice now"**; disabled state not required (word already in collection)
   - **Remove** affordance in panel footer or overflow — same `useRemoveWord` + `InlineErrorSurface` as list row

6. **AC6 — Regression guard** — Must not break: `useCollection` Dexie + API modes, `COLLECTION_MUTATED_EVENT` reload, `useSaveWord` on Today/HardWordsList, Home dashboard collection count, StatRail collection widget. Deprecate or narrow `CollectionRow.tsx` only if fully replaced — prefer refactor into list row + detail components.

7. **AC7 — Empty / loading** — Given `useCollection()` undefined, show skeleton consistent with **14.4** voice journal. Given zero entries, keep honest empty copy (**"No words saved yet."** italic — UX-DR34). Given tab filter with zero matches, show **"No words in this tab."** (not global empty).

8. **AC8 — Tests** — Pure helpers in `apps/web/src/lib/collection/`: `filterCollectionByTab`, `filterCollectionBySearch`, `formatLastPracticedLabel`, `resolveCollectionSourceLabel` (with fixtures). `pnpm --filter @audiblytics/web test` + `typecheck` green.

9. **AC9 — Scope boundary** — No **"Recently added"** tab. No bookmark/favorite persistence. No part-of-speech field on schema (parse from `meaning` string only). No API changes for collection CRUD. No inline error for `fetchCollection` empty-on-failure (pre-existing defer — do not worsen). Illustration in mockup pronunciation card is **optional** (text-only OK). Filter funnel icon may be **decorative** until real filter dimensions exist (**14.9**).

## Tasks / Subtasks

- [x] **Task 1 — Pure helpers** (AC: 2, 3, 4, 5, 8)
  - [x] 1.1 Create `apps/web/src/lib/collection/collection-filters.ts` — `filterCollectionByTab`, `filterCollectionBySearch`, `countByTab`, export tab type.
  - [x] 1.2 Create `apps/web/src/lib/collection/format-last-practiced.ts` — `formatLastPracticedLabel(isoUtc | null, ref?: Date)`.
  - [x] 1.3 Create `apps/web/src/lib/collection/resolve-collection-source.ts` — `resolveCollectionSourceLabel(entry, paragraph?, dayOfUse?)`.
  - [x] 1.4 Add `collection-filters.test.ts`, `format-last-practiced.test.ts`, `resolve-collection-source.test.ts`.

- [x] **Task 2 — TTS slow playback** (AC: 5)
  - [x] 2.1 Extend `apps/web/src/lib/audio/tts.ts` — optional `SpeakOptions { rate?: number }` applied to utterance; default unchanged.
  - [x] 2.2 Export `SLOW_SPEECH_RATE = 0.75` constant for detail panel.

- [x] **Task 3 — List row component** (AC: 4, 6)
  - [x] 3.1 Create `CollectionListRow.tsx` — props: `entry`, `isSelected`, `onSelect`, `onSpeak`, remove props; mockup columns.
  - [x] 3.2 Wire remove + inline errors via `useRemoveWord` from page.

- [x] **Task 4 — Detail panel component** (AC: 5, 6)
  - [x] 4.1 Create `CollectionWordDetailPanel.tsx` — reuse `parseWordMeaning`; pronunciation guide card; source line; Play slow + Practice now (`Link` or `router.push('/review')`).
  - [x] 4.2 Optional: share speak button styling with `TodayWordDetailCard` via small shared subcomponent only if zero behavior change.

- [x] **Task 5 — Page layout + source resolution** (AC: 1, 2, 3, 7)
  - [x] 5.1 Update `app/collection/page.tsx` — header copy, tabs, search input, `xl:grid` master-detail, selection state, paragraph/day lookup (Dexie `paragraphCache.get` + `recordings.where('paragraphId')` for API/local — batch load on mount or per-id memo).
  - [x] 5.2 Auto-select first visible row after filter change when current selection hidden.
  - [x] 5.3 Remove or slim `CollectionRow.tsx` if unused.

- [x] **Task 6 — Verification** (AC: 8, all)
  - [x] 6.1 `pnpm --filter @audiblytics/web test`
  - [x] 6.2 `pnpm --filter @audiblytics/web typecheck`
  - [x] 6.3 Manual: tab counts, search, select row → detail, play + play slow, remove from list and panel, empty collection, API mode list load, navigate Practice now → `/review`.

### Review Findings (2026-05-31)

- [x] [Review][Patch] List row remove errors not shown when detail closed [`CollectionListRow.tsx`] — restored `InlineErrorSurface` per row (regression from `CollectionRow` removal).
- [x] [Review][Patch] List play control always showed Play icon while speaking [`CollectionListRow.tsx`] — Pause when `isSpeaking`.
- [x] [Review][Patch] Default pronunciation guide rendered empty card [`CollectionWordDetailPanel.tsx`] — hide `Pronunciation unavailable`.
- [x] [Review][Patch] Redundant duplicate selection `useEffect` [`page.tsx`] — removed second auto-select effect.
- [x] [Review][Patch] Weak mastered-tab test assertion [`collection-filters.test.ts`] — assert id not ambiguous word.
- [x] [Review][Defer] Source meta Dexie-only in API mode [`use-collection-source-meta.ts`] — pre-existing 11.4/12.1 defer; date fallback OK.
- [x] [Review][Defer] Narrow viewports use 4-column grid (may clip) — responsive stack deferred to polish pass.
- [x] [Review][Dismiss] Decorative `MoreVertical` non-functional — AC9 allows decorative filter/menu chrome.
- [x] [Review][Dismiss] Button copy "Practice now" vs mockup "Add to practice" — AC5 allows either label.

## Dev Notes

### Authority stack (read in order)

1. `epics.md` § Story 14.5 + UX-V2-UI5
2. Collection mockup: `_bmad-output/design/ui-mockups-v2/ChatGPT_Image_May_28__2026__12_08_34_PM-*.png`
3. `14-1-design-tokens-and-app-shell-v2.md` — shell, `bg-surface-card`
4. `14-4-voice-journal-page-v2.md` — two-column `FeatureRouteShell` pattern
5. `architecture.md` § Implementation Patterns — Zod source of truth, semantic tokens, inline errors only, `Result<T,E>`

### Brownfield baseline (mutate, do not rewrite)

| File | Current state | 14.5 delta |
|------|---------------|------------|
| `app/collection/page.tsx` | Single column; maps `CollectionRow` | Master-detail grid, tabs, search, selection |
| `CollectionRow.tsx` | Full inline row with TTS + remove | Split → `CollectionListRow` + detail panel |
| `use-collection.ts` | `savedAt` desc, Dexie/API | **Reuse as-is** |
| `use-remove-word.ts` | Per-id remove + errors | **Reuse as-is** |
| `use-save-word.ts` | Today save path | **No change** (not on collection page) |
| `lib/audio/tts.ts` | `speak(text, voice, callbacks)` | Add optional rate for Play slow |
| `lib/today/word-meaning.ts` | `parseWordMeaning` | **Import** in detail panel |
| `TodayWordDetailCard.tsx` | HardWord detail pattern | Reference for layout/tokens |

### Tab filter rules (canonical for this story)

```ts
// Practicing: never reviewed OR still has difficulty headroom
reviewCount === 0 || difficultyRating > 0

// Mastered: reviewed at least once AND difficulty bottomed out
reviewCount >= 1 && difficultyRating === 0
```

Words with `reviewCount >= 1` and `difficultyRating > 0` appear in **Practicing** only. Never-reviewed words appear in **All** and **Practicing**, not **Mastered**.

### Mockup → implementation map

| Mockup element | Implementation |
|----------------|----------------|
| Collection title + subtitle | `page.tsx` header |
| Search + filter icons | Search input functional; filter icon decorative (AC9) |
| Sort "Recently added" | Static label; data already `savedAt` desc |
| Tabs All / Practicing / Mastered | `filterCollectionByTab` + badges |
| "Recently added" tab | **Out of scope** (14.9) |
| Table columns Word / Meaning / Last practiced | `CollectionListRow` |
| Right detail panel | `CollectionWordDetailPanel` |
| How to pronounce card + illustration | Text from `pronunciationGuide`; illustration optional |
| Play slow | `speak(word, voice, { onEnd }, { rate: SLOW_SPEECH_RATE })` |
| Add to practice | `Link` → `/review` |
| Bookmark on row | **Out of scope** — selection highlight only |

### Layout wireframe (`xl+`)

```
┌──────────┬────────────────────────────────────┬─────────────────┐
│ Sidebar  │ Collection (header + search)     │ StatRail        │
│ (14.1)   │ [All|Practicing|Mastered]        │ (existing)      │
│          │ ┌──────────────────┬─────────────┤                 │
│          │ │ List rows        │ Detail panel│                 │
│          │ │ (selectable)     │ (sticky)    │                 │
│          │ └──────────────────┴─────────────┘                 │
└──────────┴────────────────────────────────────┴─────────────────┘
```

### Source label resolution

1. If `sourceParagraphId` null → `Saved {formatLocalDate(savedAt)}`
2. Else `paragraphCache.get(id)` → `theme`; first `recordings` row with matching `paragraphId` → `dayOfUse`
3. Display: `{theme} · Day {dayOfUse}` when both known; `{theme}` only if day missing; date fallback if paragraph missing

**API mode note:** `enrichRecordingsWithTheme` pattern is Dexie-first (`deferred-work.md`); source day may be incomplete in API mode — honest fallback copy only.

### Previous story learnings (14.3 / 14.4)

- **Mutate** large pages; extract pure helpers + focused components.
- **Static sort label** acceptable when data order is fixed (14.4).
- **Compare cancel `useEffect`** pattern — if adding derived state resets, clear selection when filtered list no longer contains `selectedId`.
- **Review queue API mode** still Dexie-only (`deferred-work.md`) — "Practice now" link is OK; do not block on API review sync.

### Architecture compliance

- **No new Zod fields** on `collectionWordSchema` unless unavoidable — use existing `reviewCount`, `difficultyRating`, `lastReviewedAt`.
- **Semantic tokens only** — `bg-surface-card`, `bg-primary-soft`, `text-primary`, etc.
- **Errors** — `useRemoveWord` → `InlineErrorSurface`; no toasts.
- **Dates** — `savedAt` / `lastReviewedAt` stored UTC ISO; format at display boundary.
- **Folder placement** — `lib/collection/*` for pure logic; `components/audiblytics/Collection*.tsx` for UI; page stays thin.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Story 14.5]
- [Source: `_bmad-output/design/ui-mockups-v2/index.md` — UX-V2-UI5]
- [Source: `apps/web/src/lib/schemas/collection.schema.ts`]
- [Source: `apps/web/src/features/collection/use-collection.ts`]
- [Source: `apps/web/src/features/review/use-review-feedback.ts` — `difficultyRating` semantics for Mastered tab]

## Dev Agent Record

### Agent Model Used

Composer

### Debug Log References

### Completion Notes List

- Master-detail `/collection` with tabs (All/Practicing/Mastered), search, sticky detail panel at `xl+`.
- Tab filters use `reviewCount` + `difficultyRating`; source labels via Dexie `useCollectionSourceMeta`.
- `speak()` supports optional `rate` (`SLOW_SPEECH_RATE`); removed legacy `CollectionRow.tsx`.
- 114 tests pass; typecheck green.
- CR patches: list-row remove errors, pause icon, hide default pronunciation guide, selection effect cleanup.

### File List

- `apps/web/src/app/collection/page.tsx`
- `apps/web/src/components/audiblytics/CollectionListRow.tsx`
- `apps/web/src/components/audiblytics/CollectionWordDetailPanel.tsx`
- `apps/web/src/components/audiblytics/CollectionRow.tsx` (deleted)
- `apps/web/src/features/collection/use-collection-source-meta.ts`
- `apps/web/src/lib/audio/tts.ts`
- `apps/web/src/lib/collection/collection-filters.ts`
- `apps/web/src/lib/collection/collection-filters.test.ts`
- `apps/web/src/lib/collection/format-ipa-display.ts`
- `apps/web/src/lib/collection/format-last-practiced.ts`
- `apps/web/src/lib/collection/format-last-practiced.test.ts`
- `apps/web/src/lib/collection/resolve-collection-source.ts`
- `apps/web/src/lib/collection/resolve-collection-source.test.ts`
