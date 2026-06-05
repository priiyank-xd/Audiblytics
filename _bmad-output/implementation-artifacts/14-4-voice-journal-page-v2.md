# Story 14.4: Voice Journal Page v2

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Priyank,
I want Voice Journal as a rich list with waveforms and compare card,
so that the journal matches the voice-journal mockup (UX-V2-UI4).

## Acceptance Criteria

> Sourced from `epics.md` § Story 14.4, UX-V2-UI4, and `_bmad-output/design/ui-mockups-v2/ChatGPT_Image_May_28__2026__10_42_23_AM-*.png`. Builds on **14.1** shell (sidebar nav includes Voice Journal) and Epic 3 compare/playback plumbing.

1. **AC1 — Page layout (list + right rail)** — Given `/voice-journal`, when recordings exist at `xl+`, then page uses **two columns inside `FeatureRouteShell`**: left = recordings list (primary), right = **Compare sessions** card + **Your notes** card. Below `xl`, right-rail cards stack below the list. Global `StatRail` on `/voice-journal` unchanged (not suppressed like `/today`). Header: **"Voice Journal"** + subtitle **"Your recordings. Your progress."** (mockup copy).

2. **AC2 — Recording row v2** — Given each recording row, when rendered, then row shows:
   - **Play** control (forest primary circle or token-equivalent; reuse existing playback via `playRecordingItem` / hidden `<audio>`)
   - **Title line**: warm-up rows → `Warm-up` badge + `Day N`; paragraph rows → `Day N · {themeLabel}` (from `RecordingWithTheme`)
   - **Date/time**: local display from `recordingDate` ISO (e.g. `May 27, 2026 · 2:14 PM`) — extract formatter to `lib/voice-journal/`
   - **Waveform placeholder**: CSS bar strip (reuse `RecordPanel` `WAVEFORM_BAR_CLASSES` pattern or shared `RecordingWaveformPlaceholder` component; **not** live audio analysis)
   - **Metric chips**: Clarity, Pace, Pauses — from `deriveRecordingRowLabels(durationMs)` (honest deterministic rules; no fake LLM scores)
   - **Duration** label (existing `formatDurationLabel` logic OK)
   - Preserve **download**, **OfflineBadge**, warm-up distinction, `hideCompare` embed mode for archived-day lists

3. **AC3 — Compare sessions card** — Given compare mode, when user selects **two** recordings (existing `useCompareRecordings` checkbox flow), then **`CompositePlayer`** mounts inside the right-rail **Compare sessions** card with `mode="compare"` and existing `compareSources`. Card shows selected **Day A / Day B** labels (from `dayOfUse`). **Compare** / **Cancel compare** affordance remains discoverable. Do **not** invent delta percentage bars unless honestly derivable from existing data (defer mockup 62%→82% deltas to **14.9**).

4. **AC4 — Private notes** — Given **Your notes** card, when user types, then text persists via `useLocalStorage` key **`audiblytics.voiceJournalNotes`** with exported Zod schema `voiceJournalNotesSchema` (`{ notes: string }`, default `''`). Debounce optional; save on change is fine for n=1. **No server/API** notes in this story.

5. **AC5 — Empty / loading** — Given `useRecordings()` loading, show skeleton consistent with other v2 routes. Given zero recordings, keep honest empty copy (italic serif OK) — no fake rows.

6. **AC6 — Regression guard** — Must not break: API vs Dexie playback (`fetchRecordingPlaybackUrl`), `RECORDINGS_MUTATED_EVENT` reload, compare row dim/highlight phases, download filename pattern, archived-day `hideCompare` usage.

7. **AC7 — Tests** — `lib/voice-journal/recording-row-labels.ts`: `deriveRecordingRowLabels`, `formatRecordingDateTime` (or separate file) with `node:test`. `pnpm --filter @audiblytics/web test` + `typecheck` green.

8. **AC8 — Scope boundary** — No **Today's Insight** LLM banner, no **AI Session Reflection** card (14.9). No pagination / "Load more" unless list exceeds 50 rows (n=1 unlikely). No new backend recording analytics endpoints. No inline error for `fetchRecordings` empty-on-failure (pre-existing defer in `deferred-work.md` — do not worsen).

## Tasks / Subtasks

- [x] **Task 1 — Pure helpers + schema** (AC: 2, 4, 7)
  - [x] 1.1 Create `apps/web/src/lib/schemas/voice-journal-notes.schema.ts` — `voiceJournalNotesSchema`, export type.
  - [x] 1.2 Create `apps/web/src/lib/voice-journal/recording-row-labels.ts` — `deriveRecordingRowLabels(durationMs)`, document thresholds in comment.
  - [x] 1.3 Create `apps/web/src/lib/voice-journal/format-recording-display.ts` — `formatRecordingDateTime(isoUtc: string, ref?: Date)` for local date + time.
  - [x] 1.4 Add `recording-row-labels.test.ts` + `format-recording-display.test.ts` (or single test file).

- [x] **Task 2 — Shared waveform placeholder** (AC: 2)
  - [x] 2.1 Extract `RecordingWaveformPlaceholder.tsx` in `components/audiblytics/` — static bars using semantic tokens (`bg-primary-soft`), optional `seed` from `recording.id` for stable bar heights per row.
  - [x] 2.2 Optionally refactor `RecordPanel.tsx` to import shared bars (only if zero behavior change — else duplicate pattern minimally).

- [x] **Task 3 — Row component** (AC: 2, 6)
  - [x] 3.1 Create `VoiceJournalRecordingRow.tsx` — props: `row`, compare mode flags, play state, handlers; mockup layout (play | meta + waveform + chips | duration + menu).
  - [x] 3.2 Three-dot menu: keep **download** only (no new actions); use `DropdownMenu` or icon button matching existing download behavior.

- [x] **Task 4 — Right rail cards** (AC: 3, 4)
  - [x] 4.1 Create `VoiceJournalCompareCard.tsx` — hosts compare toggle copy, checkboxes hint, `CompositePlayer` when `canPlayComparison`, day labels for A/B.
  - [x] 4.2 Create `VoiceJournalNotesCard.tsx` — textarea + `useLocalStorage('audiblytics.voiceJournalNotes', ...)`, footer "Notes are private…" copy from mockup.

- [x] **Task 5 — Page layout + list refactor** (AC: 1, 3, 5, 6)
  - [x] 5.1 Update `app/voice-journal/page.tsx` — header copy, `xl:grid` two-column shell, wire right rail.
  - [x] 5.2 Refactor `VoiceJournalList.tsx` — delegate rows to `VoiceJournalRecordingRow`; move compare UI into `VoiceJournalCompareCard` (lift `useCompareRecordings` to page or list parent); keep `hideCompare` prop for archived embeds.
  - [x] 5.3 Verify `VoiceJournalList` embedded usages (grep `hideCompare`) still work.

- [x] **Task 6 — Verification** (AC: 7, all)
  - [x] 6.1 `pnpm --filter @audiblytics/web test`
  - [x] 6.2 `pnpm --filter @audiblytics/web typecheck`
  - [x] 6.3 Manual: play row, compare two takes, notes persist after refresh, API mode playback, download, warm-up + offline badges.

### Review Findings (2026-05-31)

- [x] [Review][Patch] Paragraph row title missing Day N [`VoiceJournalRecordingRow.tsx:49`] — fixed to `Day N · {themeLabel}` per AC2.
- [x] [Review][Patch] Compare phase not reset on Cancel compare [`page.tsx`] — restored `useEffect` when `isCompareMode` false (regression from list refactor).
- [x] [Review][Defer] Download requires local `blob` in API mode [`recording-download.ts`] — pre-existing 11.4 defer; ⋮ button no-op without blob.
- [x] [Review][Defer] RecordPanel still duplicates waveform bar classes — placeholder extracted only; optional DRY in cleanup pass.
- [x] [Review][Dismiss] Metric chips are duration heuristics — AC2 allows static/derived until analytics; documented in helper comments.

## Dev Notes

### Authority stack (read in order)

1. `epics.md` § Story 14.4 + UX-V2-UI4
2. Voice Journal mockup: `_bmad-output/design/ui-mockups-v2/ChatGPT_Image_May_28__2026__10_42_23_AM-*.png`
3. `14-1-design-tokens-and-app-shell-v2.md` — shell, `bg-surface-card`
4. `architecture.md` § Implementation Patterns — Zod source of truth, `useLocalStorage`, semantic tokens, inline errors only
5. Epic 3 stories (3.4–3.5) — original Voice Journal + compare behavior

### Brownfield baseline (mutate, do not rewrite)

| File | Current state | 14.4 delta |
|------|---------------|------------|
| `app/voice-journal/page.tsx` | Single column; basic header | Two-column layout + mockup header copy |
| `VoiceJournalList.tsx` | Flat list; compare bar above list; mono metadata; no waveform/metrics | Split row + compare card; v2 row chrome |
| `use-compare-recordings.ts` | Pick 2, CompositePlayer sources | **Reuse as-is** — lift state if needed for right rail |
| `CompositePlayer.tsx` | Sequential A→B compare | **Reuse as-is** |
| `use-recordings.ts` | Dexie/API load + theme enrich | **No change** unless load error surface in scope (defer) |
| `RecordPanel.tsx` | `WAVEFORM_BAR_CLASSES` | Share or mirror in placeholder component |

### Mockup → implementation map

| Mockup element | Implementation |
|----------------|----------------|
| Voice Journal title + subtitle | `page.tsx` header |
| Today's Insight banner | **Out of scope** (14.9 / stretch) |
| Recording rows (play, title, date, waveform, KPIs) | `VoiceJournalRecordingRow` + helpers |
| Newest first dropdown | **Static label** "Newest first" (data already `orderBy` desc) — no sort UI unless trivial |
| Compare Sessions card | `VoiceJournalCompareCard` + `useCompareRecordings` + `CompositePlayer` |
| AI Session Reflection | **Out of scope** (14.9) |
| Your Notes textarea | `VoiceJournalNotesCard` + `audiblytics.voiceJournalNotes` |
| Load more | **Out of scope** — full list for n=1 |

### Layout wireframe (`xl+`)

```
┌──────────┬────────────────────────────────────┬─────────────────┐
│ Sidebar  │ Voice Journal (header)             │ StatRail        │
│ (14.1)   │ ┌──────────────────┬─────────────┐│ (existing)      │
│          │ │ Recording rows   │ Compare card││                 │
│          │ │ (waveform+chips) │ Notes card  ││                 │
│          │ └──────────────────┴─────────────┘│                 │
└──────────┴────────────────────────────────────┴─────────────────┘
```

### `deriveRecordingRowLabels` (honest rules — implement exactly)

Document in file comment; example thresholds (tune in implementation, test boundary values):

| Field | Rule (example) |
|-------|----------------|
| `clarity` | `durationMs >= 45_000` → `"Steady"`; `>= 20_000` → `"Good"`; else `"Brief"` |
| `pace` | `durationMs >= 50_000` → `"Slow"`; `<= 25_000` → `"Quick"`; else `"Balanced"` |
| `pauses` | `Math.round(durationMs / 15_000)` as string count + `" pauses"` or `"—"` when &lt; 15s |

Labels are **heuristic placeholders** until real analytics exist — never imply ML scoring.

### Notes schema

```ts
// apps/web/src/lib/schemas/voice-journal-notes.schema.ts
export const voiceJournalNotesSchema = z.object({
  notes: z.string().max(10_000),
});
export type VoiceJournalNotes = z.infer<typeof voiceJournalNotesSchema>;
```

```ts
// VoiceJournalNotesCard.tsx
const [notes, setNotes] = useLocalStorage(
  'audiblytics.voiceJournalNotes',
  voiceJournalNotesSchema.parse({ notes: '' }),
  voiceJournalNotesSchema,
);
// bind textarea to notes.notes
```

### Compare state lifting pattern

Option A (preferred): `VoiceJournalPage` owns `useCompareRecordings(recordings)` and passes props to `VoiceJournalList` + `VoiceJournalCompareCard`.

Option B: keep hook inside list but render `VoiceJournalCompareCard` as child slot — avoid duplicate hook instances.

**Critical:** exactly one `useCompareRecordings` per page view.

### `hideCompare` embed contract

Grep consumers of `<VoiceJournalList hideCompare />` (archived calendar day). When `hideCompare`:
- No compare card / checkboxes
- Rows still use v2 visual layout (waveform + chips OK)

### Folder placement (architecture.md §641–656)

| New file | Location |
|----------|----------|
| Schemas | `apps/web/src/lib/schemas/voice-journal-notes.schema.ts` |
| Helpers + tests | `apps/web/src/lib/voice-journal/` |
| UI components | `apps/web/src/components/audiblytics/` |
| Page | mutate `apps/web/src/app/voice-journal/page.tsx` |

### Behaviors that MUST NOT break

- `playRecordingItem` + API presigned URL path
- Compare mode disables per-row play (existing)
- `triggerDownload` filename `audiblytics-day-{dayOfUse}-{hhmm}.ext`
- `isWarmupRecordingParagraphId` badge
- `completions[utcDate]?.usedOfflinePack` → `OfflineBadge`
- `RECORDINGS_MUTATED_EVENT` / Dexie `storagemutated` reload

### Previous story intelligence (14.3 CR deferrals)

- Stale selection on generate — N/A here
- `ParagraphHero.tsx` orphan — unrelated
- **12.1 / 11.4 defer:** `fetchRecordings` failure → empty list — do not add toast; optional inline empty-state improvement only if zero extra scope

### Anti-patterns

- `VoiceJournalListV2.tsx` parallel route — mutate existing list/page
- Fake analytics percentages in compare card
- LLM calls for insight/reflection
- `localStorage.setItem` without `useLocalStorage` + Zod
- Arbitrary hex colors for waveform bars
- Breaking `hideCompare` archived-day embed

### Testing approach

```ts
assert.equal(deriveRecordingRowLabels(50_000).pace, 'Slow');
assert.match(formatRecordingDateTime('2026-05-27T14:14:00.000Z'), /May 27, 2026/);
```

Use fixed `ref` Date in formatter tests for stability.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` § Story 14.4, UX-V2-UI4]
- [Source: `_bmad-output/design/ui-mockups-v2/index.md`]
- [Source: `apps/web/src/components/audiblytics/VoiceJournalList.tsx`]
- [Source: `apps/web/src/features/voice-journal/use-compare-recordings.ts`]
- [Source: `apps/web/src/components/audiblytics/CompositePlayer.tsx`]
- [Source: `apps/web/src/components/audiblytics/RecordPanel.tsx` § WAVEFORM_BAR_CLASSES]
- [Source: `14-3-today-session-three-column-layout.md`]

## AI Engineering Record

| AI-Phase | AI-Tool | Story-Ref |
|---|---|---|
| story | cursor/composer-2.5-fast | 14-4-voice-journal-page-v2 |
| code | cursor/composer-2.5-fast | 14-4-voice-journal-page-v2 |
| test | cursor/composer-2.5-fast | 14-4-voice-journal-page-v2 |
| review | cursor/composer-2.5-fast | 14-4-voice-journal-page-v2 |
| deploy | pending | |

## Dev Agent Record

### Agent Model Used

composer-2.5-fast

### Debug Log References

### Completion Notes List

- Page owns single `useCompareRecordings`; list + compare card share phase/unavailable state.
- Row v2: `bg-surface-card`, forest play circle, waveform placeholder, duration-derived metric chips.
- Notes: `audiblytics.voiceJournalNotes` + Zod schema.
- Download via MoreVertical button (triggers same filename pattern as before).
- RecordPanel not refactored (duplicate bar pattern in placeholder only).
- CR patches: Day N in paragraph title; compare state reset on cancel.
- **106 tests** pass; typecheck green.

### File List

- `apps/web/src/lib/schemas/voice-journal-notes.schema.ts`
- `apps/web/src/lib/voice-journal/recording-row-labels.ts`
- `apps/web/src/lib/voice-journal/recording-row-labels.test.ts`
- `apps/web/src/lib/voice-journal/format-recording-display.ts`
- `apps/web/src/lib/voice-journal/format-recording-display.test.ts`
- `apps/web/src/lib/voice-journal/recording-download.ts`
- `apps/web/src/components/audiblytics/RecordingWaveformPlaceholder.tsx`
- `apps/web/src/components/audiblytics/VoiceJournalRecordingRow.tsx`
- `apps/web/src/components/audiblytics/VoiceJournalCompareCard.tsx`
- `apps/web/src/components/audiblytics/VoiceJournalNotesCard.tsx`
- `apps/web/src/components/audiblytics/VoiceJournalList.tsx`
- `apps/web/src/app/voice-journal/page.tsx`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/14-4-voice-journal-page-v2.md`

## Change Log

- 2026-05-31: CR — approved; 2 patch (applied), 2 defer, 1 dismiss; status → done.
- 2026-05-31: Voice Journal v2 — two-column layout, rich rows, compare card, private notes (106 tests).
- 2026-05-31: Story created — Voice Journal page v2 mockup alignment (ready-for-dev).
