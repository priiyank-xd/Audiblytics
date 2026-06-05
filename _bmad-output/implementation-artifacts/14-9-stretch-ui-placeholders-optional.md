# Story 14.9: Stretch UI Placeholders (Optional)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Priyank,
I want placeholder UI for live feedback and AI reflection,
so that mockup parity exists without new backend work (**UX-V2-UI9**).

## Acceptance Criteria

> Sourced from `epics.md` § Story 14.9, **UX-V2-UI9**, and `_bmad-output/design/ui-mockups-v2/index.md` (stretch items). **Optional epic closer** — small scope; no new LLM endpoints, no fake analytics numbers. Builds on **14.3** (Today right column) and **14.4** (Voice Journal right rail).

1. **AC1 — Stretch feature flag** — Given the app loads, when `isStretchUiEnabled()` is true, then stretch placeholder UI may render (see AC2–AC3). When false (default), behavior is **unchanged** from post-14.8 builds. Flag source: `lib/config/stretch-ui.ts` reading `process.env.NEXT_PUBLIC_AUDIBLYTICS_STRETCH_UI === 'true'`. Document in `apps/web/.env.example`. **No** localStorage toggle required (env-only keeps n=1 simple).

2. **AC2 — Today Live Feedback placeholders** — Given `/today` and stretch flag **enabled**, when right column renders, then show a **"Live feedback"** section (`bg-surface-card` or `bg-surface` consistent with adjacent cards) with **three** metric cards:
   - **Pace** — value **`—`** (em dash, not fabricated WPM)
   - **Clarity** — value **`—`**
   - **Accuracy** — value **`—`**
   Section footer or subcaption: **"Coming soon"** (`text-caption text-secondary`). Place **above** or **replacing** the existing **Reading analysis** block while flag is on — **prefer replace** so mockup does not duplicate real + fake metrics. When stretch flag **disabled**, retain existing **Reading analysis** with real `recordingAnalysis` values (**14.3** regression — do not remove transcript-based pace/accuracy when flag off).

3. **AC3 — Voice Journal AI reflection placeholder** — Given `/voice-journal` with recordings loaded (non-empty list layout) and stretch flag **enabled**, when right rail renders, then show **`VoiceJournalAiReflectionCard`** below `VoiceJournalCompareCard` and above `VoiceJournalNotesCard` (or between compare and notes per mockup):
   - Title: **"AI session reflection"**
   - Body: static placeholder copy (e.g. **"Reflections on your session will appear here once this feature ships."**) — **no** LLM fetch, no loading spinner implying network call
   - Optional decorative sparkle icon OK; semantic tokens only
   When stretch flag **disabled**, card **not mounted** (14.4 layout unchanged).

4. **AC4 — Honesty rules** — Stretch UI must **never**:
   - Call OpenAI/Gemini or any analysis API
   - Display fabricated percentages, WPM, or delta arrows (e.g. 62%→82%)
   - Imply live processing with polling or fake progress bars
   Use `aria-disabled` or plain text only.

5. **AC5 — Regression** — With flag **off** (default): Today recording studio, `RecordPanel`, real reading analysis after record, Voice Journal compare + notes, Review/Journey/Settings/Collection — all unchanged. With flag **on**: Today still records and saves; only **display** of analysis section swaps to placeholders; Voice Journal list/compare still functional.

6. **AC6 — Tests** — `lib/config/stretch-ui.test.ts` for `isStretchUiEnabled()` (true/false/undefined env). `pnpm --filter @audiblytics/web test` + `typecheck` green.

7. **AC7 — Scope boundary** — **Out of scope:** Review session stretch cards (overview, tip, focus area — remain absent per 14.6 AC10). Mood emoji picker. Journey export. Settings Advanced Audio (done as disabled in 14.7). Home "Today's Insight" banner. Compare delta bars on Voice Journal. Runtime localStorage flag. Backend analytics. Enabling stretch by default in production (default **false**).

## Tasks / Subtasks

- [x] **Task 1 — Stretch flag module** (AC: 1, 6)
  - [x] 1.1 Create `apps/web/src/lib/config/stretch-ui.ts` — `isStretchUiEnabled(): boolean`.
  - [x] 1.2 `stretch-ui.test.ts` with env stub pattern used elsewhere in repo.
  - [x] 1.3 Add `NEXT_PUBLIC_AUDIBLYTICS_STRETCH_UI=false` to `apps/web/.env.example` with comment.

- [x] **Task 2 — Today placeholder section** (AC: 2, 4, 5)
  - [x] 2.1 Create `TodayLiveFeedbackStretch.tsx` — three `—` cards + "Coming soon".
  - [x] 2.2 Wire in `today-app.tsx` right column: if `isStretchUiEnabled()` → stretch section; else existing Reading analysis block.

- [x] **Task 3 — Voice Journal reflection card** (AC: 3, 4, 5)
  - [x] 3.1 Create `VoiceJournalAiReflectionCard.tsx`.
  - [x] 3.2 Mount in `voice-journal/page.tsx` when stretch enabled && recordings layout visible.

- [x] **Task 4 — Verification** (AC: 6, all)
  - [x] 4.1 `pnpm --filter @audiblytics/web test`
  - [x] 4.2 `pnpm --filter @audiblytics/web typecheck`
  - [x] 4.3 Manual: flag off — Today analysis after record works; flag on — placeholders only; VJ card appears/disappears.

## Dev Notes

### Authority stack

1. `epics.md` § Story 14.9 + **UX-V2-UI9**
2. `_bmad-output/design/ui-mockups-v2/index.md` — stretch line items
3. `14-3-today-session-three-column-layout.md` — Reading analysis uses **real** `recordingAnalysis` when flag off
4. `14-4-voice-journal-page-v2.md` — explicitly deferred AI reflection to 14.9
5. `architecture.md` § Implementation Patterns — semantic tokens, no toasts, minimal scope

### Brownfield baseline

| Asset | State | 14.9 action |
|-------|--------|-------------|
| `today-app.tsx` | Reading analysis grid (Pace WPM, Accuracy %, Missed) when `recordingAnalysis` ready | Conditional stretch vs real |
| `voice-journal/page.tsx` | Compare + Notes cards | Add optional AI reflection card |
| Stretch flag | **Missing** | `NEXT_PUBLIC_AUDIBLYTICS_STRETCH_UI` |
| Review `/review` | Stretch widgets deferred in 14.6 | **Still out of scope** |

### Mockup → implementation map

| Mockup stretch element | Implementation |
|------------------------|----------------|
| Today Live Feedback Pace/Clarity/Accuracy | `TodayLiveFeedbackStretch` |
| Voice Journal AI reflection | `VoiceJournalAiReflectionCard` |
| Mood picker | **Out of scope** |
| Review tip / focus / overview | **Out of scope** (14.6) |

### Today wiring (critical regression guard)

```tsx
{isStretchUiEnabled() ? (
  <TodayLiveFeedbackStretch />
) : (
  <section aria-label="Reading analysis">…existing recordingAnalysis grid…</section>
)}
```

Do **not** show both real metrics and stretch placeholders simultaneously.

### Env flag

```bash
# apps/web/.env.local (dev only, optional)
NEXT_PUBLIC_AUDIBLYTICS_STRETCH_UI=true
```

Default unset/false in CI and `.env.example`.

### Card styling

Reuse Today right-rail patterns: `rounded-lg border border-divider bg-surface px-5 py-5` or `bg-surface-card` to match **14.3** Recording Studio section. Metric grid: `grid grid-cols-3 gap-3` mirroring existing analysis layout for visual parity.

### Epic 14 completion

This is the **last planned Epic 14 story**. After CR, set `epic-14: done` in sprint-status if all 14.x stories are done and retrospective is optional.

## References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Story 14.9]
- [Source: `_bmad-output/design/ui-mockups-v2/index.md`]
- [Source: `apps/web/src/features/today/today-app.tsx` — Reading analysis section]
- [Source: `apps/web/src/app/voice-journal/page.tsx`]
- [Source: `_bmad-output/implementation-artifacts/14-4-voice-journal-page-v2.md`]

## Dev Agent Record

### Completion Notes

- `isStretchUiEnabled()` env gate; default off preserves 14.3 Reading analysis and 14.4 Voice Journal layout.
- Today: conditional `TodayLiveFeedbackStretch` (Pace/Clarity/Accuracy `—`, "Coming soon") replaces Reading analysis when flag on.
- Voice Journal: `VoiceJournalAiReflectionCard` between compare and notes when flag on and recordings list layout.
- No API calls, fabricated metrics, or loading spinners.

### File List

- `apps/web/src/lib/config/stretch-ui.ts` (new)
- `apps/web/src/lib/config/stretch-ui.test.ts` (new)
- `apps/web/src/components/audiblytics/TodayLiveFeedbackStretch.tsx` (new)
- `apps/web/src/components/audiblytics/VoiceJournalAiReflectionCard.tsx` (new)
- `apps/web/src/features/today/today-app.tsx`
- `apps/web/src/app/voice-journal/page.tsx`
- `apps/web/.env.example`

### Change Log

- 2026-05-31: Story 14.9 DS — stretch UI placeholders behind `NEXT_PUBLIC_AUDIBLYTICS_STRETCH_UI`.
- 2026-05-31: Story 14.9 CR — removed `aria-hidden` on placeholder em dashes (AC4 a11y).

## Senior Developer Review (AI)

**Outcome:** Approve (with 1 patch applied)  
**Date:** 2026-05-31

### Review Findings

- [x] [Review][Patch] Placeholder metric values hidden from screen readers [`TodayLiveFeedbackStretch.tsx:32`] — `aria-hidden` on em dash conflicted with AC4 “plain text”; removed so `—` is announced.
- [x] [Review][Defer] `NEXT_PUBLIC_*` requires dev server rebuild to toggle stretch — standard Next.js build-time inlining, same as `storage-backend`.

### AC audit

| AC | Result |
|----|--------|
| AC1 Flag + `.env.example` | Pass |
| AC2 Today Live feedback replace | Pass |
| AC3 Voice Journal AI card placement | Pass |
| AC4 Honesty (no APIs/fake metrics) | Pass (after a11y patch) |
| AC5 Regression flag off | Pass (conditional wiring) |
| AC6 Tests + typecheck | Pass (134 tests) |
| AC7 Scope boundary | Pass |
